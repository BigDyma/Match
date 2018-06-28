var express = require("express"),
	bodyParser = require("body-parser"),
	app = express(),
	dtb = require('mongodb'),
	cookieParser = require('cookie-parser'),
	session = require('express-session');
	//pentru hashing
var crypto = require('crypto');
var md5sum = crypto.createHash('md5');

var wc = require('which-country');
var GPS = require('gps');
var gps = new GPS;

var MongoClient = dtb.MongoClient;
var url = "mongodb://localhost:27017/matdb";

app.use(cookieParser());
app.use(session({secret: 'secretaf'}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/',function(req,res){
	if (req.session.user != null)
		return res.sendfile("./public/hello.html");
	res.sendfile("./public/index.html");
});
app.post('/logout', function(req, res) {
	req.session.destroy();
	console.log("session destroyed");
	return res.redirect('/');
})

app.post('/login', function(req,res)
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
						console.log(user.location);
						db.collection("users").update({username: req.body["username2"]}, user);
					});
					gps.update(sentence);
					if (req.session.user != null)
						req.session.destroy();
					req.session.regenerate(function(){
						req.session.user = req.body["username2"];
						return res.sendfile("./public/hello.html");
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

app.listen(8080, function(){
	var time = new Date().toString();
	console.log("Started on PORT 8080 " + time);
});