var express = require("express"),
	bodyParser = require("body-parser"),
	app = express(),
	dtb = require('mongodb'),
	cookieParser = require('cookie-parser'),
	session = require('express-session');
	//pentru hashing
	var crypto = require('crypto');
	var md5sum = crypto.createHash('md5');

var MongoClient = dtb.MongoClient;
var url = "mongodb://localhost:27017/matdb";
var urltoparse = require('url');
var sendmail = require('sendmail')();
var token = "";
var emaill = "";

function sendem(linkk, destin)
{
	sendmail({
		from: 'no-reply@matcha.com',
		to: destin,
		subject: "Reset password",
		html: 'Please, reset your password here: ' + linkk + " .",
		}, function(err, reply) {
		// console.log(err && err.stack);
		console.log(reply);
	});
}

app.use(cookieParser());
app.use(session({secret: 'secretaf'}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post('/reset', function(req, res) {
	var url_parts = urltoparse.parse(req.url, true);
	var linkk;
	var query = url_parts.query;
	if (query['act'] == 'try')
	{
		crypto.randomBytes(24, function(err, buffer) {
			if (err) throw err;
			token = buffer.toString('hex') || "there was nothing";
		});
		MongoClient.connect(url, function(err, db) {
			if (err) throw err;
			db.collection("users").findOne({email: req.body["email"]}, function(err, user) {
				if (err) throw err;
				if (user)
				{
					user.pass_token = token;
					db.collection("users").update({email: req.body["email"]}, user);
				}
				linkk = "https://matc-ni3k.c9users.io" + req.url + '&token=' + token + '&email=' + req.body["email"];
				var linkkk = "/reset?act=domod" + '&token=' + token + '&email=' + req.body["email"];
				res.redirect(linkkk);
			});
		});
		// res.sendfile("./public/modifypass.html");
		// sendem(linkk, req.body["email"]);
		// res.end(linkk + "   good.");
	}
	else
		res.end("   good.");
});

app.post('/resetpass', function(req, res) {
	req.body["newps"] = crypto.createHash('md5').update(req.body["newps"]).digest("hex");
	req.body["newps2"] = crypto.createHash('md5').update(req.body["newps2"]).digest("hex");

	if (req.body["newps"] == req.body["newps2"])
	{
		MongoClient.connect(url, function(err, db) {
			if (err) throw err;
			db.collection("users").findOne({email: emaill}, function(err, user) {
				if (err) throw err;
				if (user)
				{
					user.password = req.body["newps"];
					db.collection("users").update({email: emaill}, user);
					emaill = "";
				}
			});
		});
		res.end("good.");
	}
});

app.get('/reset', function(req, res) {
	var url_parts = urltoparse.parse(req.url, true);
	var query = url_parts.query;
	if (query["act"] == "domod")
	{
		MongoClient.connect(url, function(err, db) {
			if (err) throw err;
			db.collection("users").findOne({email: query["email"]}, function(err, user) {
				if (err) throw err;
				if (user)
				{
					if (user.pass_token == query["token"])
					{
						res.sendfile("./public/modifypass.html");
						emaill = query["email"];
					}
					else
						res.end("Wrong Link");
				}
			});
		});
	}
	else
		res.sendfile("./public/resetpass.html");
});


// app.post('/login', function(req,res)
// {
// 	MongoClient.connect(url, function(err, db) {
// 		if (err) throw err;
// 		db.collection("users").findOne({username: req.body["username2"]}, function(err, user) {
// 			if (err) throw err;
// 			if (user)
// 			{
// 				req.body["password2"] = crypto.createHash('md5').update(req.body["password2"]).digest("hex");
// 				if (user.password == req.body["password2"])
// 				{
// 					var sentence = '$GPGGA,224900.000,4832.3762,N,00903.5393,E,1,04,7.8,498.6,M,48.0,M,,0000*5E';
// 					gps.on('data', function(parsed) {
// 						user.location = parsed;
// 						db.collection("users").update({username: req.body["username2"]}, user);
// 					});
// 					gps.update(sentence);
// 					if (req.session.user != null)
// 						req.session.destroy();
// 					req.session.regenerate(function(){
// 						req.session.user = req.body["username2"];
// 						return res.sendfile("./public/hello.html");
// 					});
// 				}
// 				else
// 				{
// 					return res.send("Wrong Pass");
// 				}
// 			}
// 			else {
// 				return res.send("not zbs, wrong username");
// 			}
// 		});
// 	});
// });

app.listen(8081, function(){
	var time = new Date().toString();
	console.log("Started on PORT 8080 " + time);
});