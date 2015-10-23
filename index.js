var WebSocketServer = require('ws').Server;  
var wss = new WebSocketServer({port: 7000});
var pjson = require('./package.json');
var fs = require('fs');
var colors = require('colors');
var config = require('./config').settings;
var uuid = require('uuid');

var Clients = [];

var art = fs.readFileSync('art.txt', 'utf8');
console.log('\n' + art + '\n\n' + 'Version ' + colors.white(pjson.version));
console.log('\n' + 'http://localhost:' + config.port + '\n\n');


wss.on('connection', function connection(ws) {  
	// On Connect
	ws.uuid = uuid.v4();
	Clients.push(ws.uuid);
	var payload = {
		id: ws.uuid,
		clients: Clients,
		broadcast: "::broadcast:: More clients connected"
	};
	wss.broadcast((payload));

	// On Message
	ws.on('message', function incoming(message) {

		var payload = {
			msg: message,
			id: ws.uuid,
			clients: Clients
		};

		if(payload.msg.indexOf('::broadcast::') > -1) {
			payload.broadcast = message;
			wss.broadcast(payload);
		} else if(message) {
			ws.send(JSON.stringify(payload));
		}
	});

	// On Close
	ws.on('close', function close() {
		var index = Clients.indexOf(ws.uuid);
		Clients.splice(index,1)

		var payload = {
			clients: Clients,
			broadcast: '::broadcast:: ' + ws.uuid + ' has disconnected'
		}
		wss.broadcast((payload));
	});

});

wss.broadcast = function(data) {
	if (data.broadcast) {
		var mydata = data.broadcast.replace('::broadcast:: ', '');	
	} else {
		mydata = "More users connected";
	}
	
	data.broadcast = mydata;
	data.msg = "";
	
	for(var i in this.clients) {
		this.clients[i].send(JSON.stringify(data));
	}
}