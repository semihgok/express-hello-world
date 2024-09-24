const express = require('express');
const expressWs = require('express-ws');
const app = expressWs(express()).app;
const port = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use(express.static('public'));

// User data and boards storage
const users = {
    "semih": { "ws": null, "token": "" }
};

const boards = [
    { "boardName": "esp1", "ws": null, "status": false, "owner": "semih", "timeout": new Date() }
];

// Route definitions
app.get('/', (req, res) => res.render("index"));
app.get('/relay', (req, res) => res.render("relay"));

// WebSocket Handling
const websocketHandler = require('./websocketHandler');
app.ws('/semih', websocketHandler(users, boards));
setInterval(() => {
    boards.forEach(board => {
        if (board.ws) {
            board.ws.send("status");
        }
    });
}, 1000);
// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
