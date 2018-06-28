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


app.use(cookieParser());
app.use(session({secret: 'secretaf'}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.get('/',function(req,res){
	res.sendfile("./public/search.html");
});

app.post('/search',function(req,res)
{
    
 //    res.setHeader('Content-Type', 'application/json');
 //   res.send((req.body));
    
    MongoClient.connect(url, function(err, db) {
  if (err) throw err;
   var query = { };
   if (req.body["username"] != "")
   query.username =req.body['username'] 
    if (req.body['agemin'] == "")
		req.body['agemin'] = 16;
	if (req.body['agemax'] == "")
		req.body['agemax'] = 50;
	if (req.body['gapmin'] == "")
		req.body['gapmin'] = -1;
	if (req.body['gapmax'] == "")
		req.body['gapmax'] = 1000;
	query["personal.fame"] = {$gte:req.body["gapmin"],$lte:req.body["gapmax"]};
    query["personal.age"] = {$gt:req.body['agemin'],$lt:req.body['agemax']};
    query["location.country"] = req.body["country"];
    db.collection("users").find(query).toArray(function(err, result) {
    if (err) throw err;
     res.setHeader('Content-Type', 'application/json');
     console.log(req.body);
     console.log(query);
    res.send((result));
    db.close();
  });
    });
    
});


var server = app.listen(8080, function () {
	var host = server.address().address;
	var port = server.address().port;
	console.log("Example app listening at http://%s:%s", host, port)
})