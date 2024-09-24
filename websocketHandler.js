function generateToken(length = 32) {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
}

function refreshToken(username, users) {
	users[username].token = generateToken();
}

function checkToken(token, username, users) {
	return token === users[username]?.token;
}

function findBoardByName(boardName, boards) {
	return boards.find(board => board.boardName === boardName);
}

module.exports = (users, boards) => {
	return (ws, req) => {
		ws.on('message', (msg) => {
			try {
		        data = JSON.parse(msg);
		    } catch (error) {
		        console.error('JSON parse error:', error);
		        ws.send(JSON.stringify({ type: 'error', message: 'Geçersiz mesaj formatı.' }));
		        return; // Hatalı mesajı işleme almayı durdur
		    }
			console.log(data);

			switch (data.type) {
				case 'setName':
					handleSetName(data, ws, users);
					break;
				case 'toBoard':
					handleToBoard(data, ws, users, boards);
					break;
				case 'fromBoard':
					handleFromBoard(data, users);
					break;
				case 'status':
					handleStatus(data, boards);
					break;
				case 'boardStatus':
					handleBoardStatus(data, ws, users, boards);
					break;
				case 'board':
					handleBoard(data, ws, boards);
					break;
				case 'checkRelays':
					handleCheckRelays(data, ws, users, boards);
					break;
				default:
					ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
			}
		});

		ws.on('close', () => {
			console.log("Client disconnected")
			for (const username in users) {
				if (users[username].ws === ws) {
					users[username].ws = null;
					break;
				}
			}
			boards.forEach(board => {
				if (board.ws === ws) {
					board.ws = null; // WebSocket'i null yap
					board.status = false; // Durumu false yap
				}
			});
		});
	};
}

function handleSetName(data, ws, users) {
	if (users[data.name]) {
		console.log(`Client logged in: ${data.name}`);
		users[data.name].ws = ws;
		refreshToken(data.name, users);
		ws.send(JSON.stringify({ type: 'confirmation', name: data.name, token: users[data.name].token, message: `Welcome, ${data.name}!` }));
	} else {
		ws.send(JSON.stringify({ type: 'error', message: `User not found: ${data.name}` }));
	}
}

function handleToBoard(data, ws, users, boards) {
	if (checkToken(data.token, data.name, users)) {
		const currentBoard = findBoardByName(data.targetName, boards);
		if (currentBoard && currentBoard.status) {
			currentBoard.ws?.send(JSON.stringify({ type: 'message', message: data.message }));
		} else {
			ws.send(JSON.stringify({ type: 'error', message: "Cannot reach the board" }));
		}
	} else {
		ws.send(JSON.stringify({ type: 'error', message: "Invalid Token" }));
	}
}

function handleFromBoard(data, users) {
	const targetUser = users[data.targetName];
	targetUser?.ws?.send(JSON.stringify({ type: 'boardMessage', message: data.message }));
}

function handleStatus(data, boards) {
	const currentBoard = findBoardByName(data.name, boards);
	if (currentBoard) {
		currentBoard.timeout = new Date();
		currentBoard.status = true;
	}
}

function handleBoardStatus(data, ws, users, boards) {
	if (checkToken(data.token, data.name, users)) {
		const currentBoard = findBoardByName(data.boardName, boards);
		if (currentBoard) {
			const elapsed = new Date() - currentBoard.timeout;
			if(elapsed > 1500){
				currentBoard.status = false
			}
			ws.send(JSON.stringify({ type: 'boardStatus', status: currentBoard.status }));
		} else {
			ws.send(JSON.stringify({ type: 'error', message: "Board not found" }));
		}
	} else {
		ws.send(JSON.stringify({ type: 'error', message: "Invalid Token" }));
	}
}

function handleBoard(data, ws, boards) {
	const currentBoard = findBoardByName(data.name, boards);
	if (currentBoard) {
		currentBoard.ws = ws;
		currentBoard.timeout = new Date();
		currentBoard.status = true;
	} else {
		ws.send(JSON.stringify({ type: 'error', message: "Board not found" }));
	}
}

function handleCheckRelays(data, ws, users, boards) {
	if (checkToken(data.token, data.name, users)) {
		const currentBoard = findBoardByName(data.targetName, boards);
		if (currentBoard && currentBoard.status) {
			currentBoard.ws?.send(JSON.stringify({ type: 'message', message: "checkRelays" }));
		}
	} else {
		ws.send(JSON.stringify({ type: 'error', message: "Invalid Token" }));
	}
}