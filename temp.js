var http = require('http');
var path = require('path');

var async = require('async');
var socketio = require('socket.io');
var express = require('express');

var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

var	bodyParser = require("body-parser");
var	dtb = require('mongodb');															// mongod --bind_ip=$IP --nojournal --rest "$@"
var	cookieParser = require('cookie-parser');
var	session = require('express-session');

var crypto = require('crypto');
var md5sum = crypto.createHash('md5');

var hbs = require("hbs");
var formidable = require('formidable');
var fs = require('fs');

router.use(cookieParser());
router.use(session({secret: 'secretaf'}));
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());


var wc = require('which-country');
var GPS = require('gps');
var gps = new GPS;

var MongoClient = dtb.MongoClient;
var url = "mongodb://localhost:27017/matdb";

router.post('/login', function(req,res)
{
	MongoClient.connect(url, function(err, db) {
		if (err) throw err;
		db.collection("users").findOne({username: req.body["username2"]}, function(err, user) {
			if (err) throw err;
			if (user)
			{
				req.body["password2"] = crypto.createHash('md5').update(req.body["password2"]).digest("hex");
				if (user.password == req.body["password2"])
				{
					var sentence = '$GPGGA,224900.000,4832.3762,N,00903.5393,E,1,04,7.8,498.6,M,48.0,M,,0000*5E';
					gps.on('data', function(parsed) {
						user.location = parsed;
						user.location['country'] = wc([user.location['lon'], user.location['lat']]);
						// console.log(user.location);
						db.collection("users").update({username: req.body["username2"]}, user);
					});
					gps.update(sentence);
					if (req.session.user != null)
						req.session.destroy();
					req.session.regenerate(function(){
						req.session.user = req.body["username2"];
						return res.sendfile("./client/hello.html");
					});
				}
				else
				{
					return res.send("Wrong Pass");
				}
			}
			else {
				return res.send("not zbs, wrong username");
			}
		});
	});
});

router.post('/register',function(req,res)
{
	MongoClient.connect(url, function(err, db) {
		if (err) throw err;
		db.collection("users").findOne({username: req.body["username"]}, function(err, user3) {
			if (err) throw err;
			if (user3)
			{
				console.log("sorry, username already used");
			}
			else {
				db.collection("users").findOne({email: req.body["email"]}, function(err, user2) {
					if (err) throw err;
					if (user2)
						console.log("sorry, email already used");
					else {
						var sentence = '$GPGGA,224900.000,4832.3762,N,00903.5393,E,1,04,7.8,498.6,M,48.0,M,,0000*5E';
						gps.on('data', function(parsed) {
							var temp = parsed;
							temp['country'] = wc([temp['lon'], temp['lat']]);
							// console.log(temp);
							req.body['location'] = temp;
						});
						gps.update(sentence);

						req.body["password"] = crypto.createHash('md5').update(req.body["password"]).digest("hex");
						req.body.personal = {};
						req.body.personal.gender = undefined;
						req.body.personal.preferences = undefined;
						req.body.personal.biography = undefined;
						req.body.personal.tagg = {};
						req.body.personal.fame = 0;
						req.body.personal.age = 18;
						req.body.avatar = "http://bit.ly/2tExICA";
						req.body.photos = [];
						db.collection("users").insertOne(req.body, function(err, rs) {
							if (err) throw err;
							console.log("registered!");
							if (req.session.user != null)
								req.session.destroy();
							req.session.regenerate(function(){
								req.session.user = req.body["username"];
								req.session.allData = {};
								req.session.allData.personal = req.body.personal;
								req.session.allData.avatar = req.body.avatar;
								req.session.allData.photos = [];
							});
							db.close();
						});
					}
				});
			}
			res.redirect('/');
		});
	});
});

router.get('/profile', (req, res) => {
	if (req.session.user == null)
	{
		return res.redirect('/');
	}
		//am schimbat aici
		var leng = req.session.allData.photos;
		//sterge din db daca imaginea nu e gasita pe server
		for (var i = 0; i < leng.length; i++)
		{
			if (!fs.existsSync( __dirname + leng[i]))
			{
				MongoClient.connect(url, function(err, db){ if (err) throw err;
					db.collection("users").update( { username: req.session.allData.username }, { $pull: { 'photos' : leng[i] } });
				});
				leng.splice(i, 1);
			}
		}
		req.session.allData.photos = leng;
	res.render('profile.hbs', 
	{
		numele:			req.session.allData.firstname				||		"I dont know",
		familia:		req.session.allData.lastname				||		"I dont know",
		email:			req.session.allData.email					||		"I dont know",
		username:		req.session.allData.username				||		"I dont know",
		gender:			req.session.allData.personal.Gender			||		"I dont know",
		preferences:	req.session.allData.personal.preferences	||		"I dont know",
		biography:		req.session.allData.personal.biography		||		"I dont know",
		age:			req.session.allData.personal.age			||					18,
		fame:			req.session.allData.personal.fame			||					0, 
		myObj:			req.session.allData.personal.tagg			||		"I dont know",
		photos:			req.session.allData.photos					||		["http://bit.ly/2tExICA"]
	});
});

router.post('/logout', function(req, res) {
	req.session.destroy();
	console.log("session destroyed");
	return res.redirect('/');
})


router.get('/', function(req, res) {
	if (req.session.user == null)
	{
		return res.sendfile("./client/login.html");
	}
		console.log(req.session.user);
	res.sendfile("./client/index.html");
});

router.use("/client", express.static(path.resolve(__dirname, 'client')));











// var messages = [];
// var sockets = [];

// io.on('connection', function (socket) {
// 		messages.forEach(function (data) {
// 			socket.emit('message', data);
// 		});

// 		sockets.push(socket);

// 		socket.on('disconnect', function () {
// 			sockets.splice(sockets.indexOf(socket), 1);
// 			updateRoster();
// 		});

// 		socket.on('message', function (msg) {
// 			var text = String(msg || '');

// 			if (!text)
// 				return;

// 			socket.get('name', function (err, name) {
// 				var data = {
// 					name: name,
// 					text: text
// 				};

// 				broadcast('message', data);
// 				messages.push(data);
// 			});
// 		});

// 		socket.on('identify', function (name) {
// 			socket.set('name', String(name || 'Anonymous'), function (err) {
// 				updateRoster();
// 			});
// 		});
// 	});

// function updateRoster() {
// 	async.map(
// 		sockets,
// 		function (socket, callback) {
// 			socket.get('name', callback);
// 		},
// 		function (err, names) {
// 			broadcast('roster', names);
// 		}
// 	);
// }

// function broadcast(event, data) {
// 	sockets.forEach(function (socket) {
// 		socket.emit(event, data);
// 	});
// }

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
	var addr = server.address();
	console.log("Chat server listening at", addr.address + ":" + addr.port);
});
