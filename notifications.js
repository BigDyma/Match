var http = require('http');
var path = require('path');

var async = require('async');
var socketio = require('socket.io');
var express = require('express');

//
// ## SimpleServer `SimpleServer(obj)`
//
// Creates a new instance of SimpleServer with the following options:
//  * `port` - The HTTP port to listen on. If `process.env.PORT` is set, _it overrides this value_.
//
var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

router.use(express.static(path.resolve(__dirname, 'public/notifications.html')));
router.use('/node_modules', express.static(__dirname + '/node_modules'));

var messages = [];
var sockets = [];

io.on('connection', function (socket) {
  messages.forEach(function (data) {
    socket.emit('message', data);
  });

  sockets.push(socket);

  socket.on('disconnect', function () {
    sockets.splice(sockets.indexOf(socket), 1);
    updateRoster();
  });

  socket.on('message', function (msg) {
    var text = String(msg || '');

    if (!text)
      return;

    socket.get('name', function (err, name) {
      var data = {
        name: name,
        text: text
      };

      broadcast('message', data);
      messages.push(data);
    });
  });

  socket.on('identify', function (name) {
    socket.set('name', String(name || 'Anonymous'), function (err) {
      updateRoster();
    });
  });
});

function updateRoster() {
  async.map(
    sockets,
    function (socket, callback) {
      socket.get('name', callback);
    },
    function (err, names) {
      broadcast('roster', names);
    }
  );
}

function broadcast(event, data) {
  sockets.forEach(function (socket) {
    socket.emit(event, data);
  });
}

router.get('/', function(req, res){
	res.sendfile(__dirname + '/public/notifications.html');
});



router.listen(8080, function(){
	console.log('listening on *:8080');
});