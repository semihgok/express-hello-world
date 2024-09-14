var express = require('express');
var app = express();
var expressWs = require('express-ws')(app);
const port = process.env.PORT || 3001;

app.set("view engine","ejs");
app.use(express.static('public'));


app.use(function (req, res, next) {
  req.testing = 'testing';
  return next();
});

app.get('/', function(req, res, next){
	//console.log('get route', req.testing);
	res.render("index");
});

app.ws('/semih', function(ws, req) {
	ws.on('message', function(msg) {
		expressWs.getWss().clients.forEach(function(i,j){
			if(ws!=i){
				if(msg=="pin_25_0"){
					i.send("dht")
				}else{
				i.send(msg)

				}
			}
		})

		console.log(msg);
	});
	console.log('socket', req.testing);
});

app.listen(port);
