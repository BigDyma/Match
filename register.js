var express = require("express"),
	bodyParser = require("body-parser"),
	app = express(),
	cookieParser = require('cookie-parser'),
	session = require('express-session'),
	dtb = require('mongodb');
	//pentru hashing
	var crypto = require('crypto');
	var md5sum = crypto.createHash('md5');

var MongoClient = dtb.MongoClient;
var url = "mongodb://localhost:27017/matdb";

var wc = require('which-country');
var GPS = require('gps');
var gps = new GPS;

app.use(cookieParser());
app.use(session({secret: 'secretaf'}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/',function(req,res){
	res.sendfile("./public/index.html");
});
app.post('/register',function(req,res)
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
							console.log(temp);
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
			res.end("good.");
		});
	});
});


var server = app.listen(8082, function () {
	var host = server.address().address;
	var port = server.address().port;
	console.log("Example app listening at http://%s:%s", host, port);
});
