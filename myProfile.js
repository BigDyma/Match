var express      = require("express"),
	bodyParser   = require("body-parser"),
	path         = require('path'),
	app          = express(),
	dtb          = require('mongodb'),
	cookieParser = require('cookie-parser'),
	session      = require('express-session'),
	//pentru hashing
	crypto       = require('crypto'),
	md5sum       = crypto.createHash('md5'),
	formidable   = require('formidable'),
	fs           = require('fs'),
	//pentru hbs
	hbs          = require("hbs"),
	MongoClient  = dtb.MongoClient,
	url          = "mongodb://localhost:27017/matdb";

	app.use(cookieParser());
	app.use(session({secret: 'secretaf'}));
	app.use(bodyParser.urlencoded({ extended: false }));
	app.use(bodyParser.json());
	app.set('view engine', 'hbs');
	app.use('/images', express.static(__dirname + '/images'));
	app.get('/', (req, res) => {
		if (req.session.user != null)
			return res.sendfile("./public/hello.html");
		else
			res.sendfile("./public/index.html");
	});
	
	app.get("/editProfile", function(req, res) 
	{
		 if (req.session.user == null)
			return res.sendfile("./public/hello.html");
		hbs.registerHelper('ifCond', function (v1, operator, v2, options){
	switch (operator) {
		case '==':
			return (v1 == v2) ? options.fn(this) : options.inverse(this);
		case '===':
			return (v1 === v2) ? options.fn(this) : options.inverse(this);
		case '!=':
			return (v1 != v2) ? options.fn(this) : options.inverse(this);
		case '!==':
			return (v1 !== v2) ? options.fn(this) : options.inverse(this);
		case '<':
			return (v1 < v2) ? options.fn(this) : options.inverse(this);
		case '<=':
			return (v1 <= v2) ? options.fn(this) : options.inverse(this);
		case '>':
			return (v1 > v2) ? options.fn(this) : options.inverse(this);
		case '>=':
			return (v1 >= v2) ? options.fn(this) : options.inverse(this);
		case '&&':
			return (v1 && v2) ? options.fn(this) : options.inverse(this);
		case '||':
			return (v1 || v2) ? options.fn(this) : options.inverse(this);
		default:
			return options.inverse(this);
	}
});
		res.render("editProfile.hbs", 
		{
			preferences: req.session.allData.personal.preferences || "I dont know",
			biography:   req.session.allData.personal.biography   || "I dont know",
			age:	     req.session.allData.personal.age         ||            18,
			fame:	     req.session.allData.personal.fame        ||             0, 
			myObj:       req.session.allData.personal.tagg        || "I dont know",
			check:      req.session.allData.personal.Gender || 0,
			photos:     req.session.allData.photos
		});
	});

	app.post("/fileupload", function(req, res) 
	{
		MongoClient.connect(url, function(err, db) 
		{ 
			if (err) throw err;
			db.collection("users").findOne({ username: req.session.user }, function(err, user)
			{
				if (err) throw err;
				var snewpath = null;
				var extension;
				var userName = req.session.user;
				var form = new formidable.IncomingForm();
				form.parse(req, function(err, fields, files) 
				{
					if (err) {console.log(err); return;}
					var oldpath = files.filetoupload.path;
					extension = '.jpg'
					// extension = get extension la file inainte era
					files.filetoupload.name = userName + '0' + extension;
					var newpath = __dirname + '/images/' + files.filetoupload.name;
					if (fs.existsSync(newpath))
					{
						for(var i = 1; i < 5; i++)
						{
							files.filetoupload.name = userName + i + extension;
							newpath = __dirname + '/images/' + files.filetoupload.name;
							if (!fs.existsSync(newpath))
								break;
						}
					}
					snewpath =  '/images/' + files.filetoupload.name;
					fs.rename(oldpath, newpath, function (err){if(err)throw err;});
					req.session.allData.photos = (typeof req.session.allData.photos == undefined) ? []: req.session.allData.photos;
					req.session.allData.photos.push(snewpath);
					db.collection("users").update( {username: userName}, {$addToSet: { photos: snewpath }} );
					return res.redirect('profile');
				});
			});
		 });
	});

	app.get('/profile', (req, res) => {
		if (req.session.user == null)
			return res.sendfile("./public/hello.html");
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
		   //pana aici
		res.render('profile.hbs', 
		{
			numele:      req.session.allData.firstname            ||    "I dont know",
			familia:     req.session.allData.lastname             ||    "I dont know",
			email:       req.session.allData.email                ||    "I dont know",
			username:    req.session.allData.username             ||    "I dont know",
			gender:      req.session.allData.personal.Gender      ||    "I dont know",
			preferences: req.session.allData.personal.preferences ||    "I dont know",
			biography:   req.session.allData.personal.biography   ||    "I dont know",
			age:	     req.session.allData.personal.age         ||               18,
			fame:	     req.session.allData.personal.fame        ||                0, 
			myObj:       req.session.allData.personal.tagg        ||    "I dont know",
			photos:      req.session.allData.photos               ||    ["http://bit.ly/2tExICA"]
		});
	});

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
						console.log("googf");
						req.session.regenerate(function(){
							req.session.user = req.body["username2"];
							console.log(JSON.stringify(user));
							req.session.allData = user;
							return res.sendfile("./public/hello.html");
						});
					}
					else
					{
						return res.send("Wrong Pass");
					}
				}
				else
				{
					return res.send("not zbs, wrong username");
				}
			});
		});
});

	app.post("/edited", function(req, res)
	{
		MongoClient.connect(url, function(err, db)
		{ 
			 if (err)
			 {
				console.log(err);
				return;
			 }
			 db.collection("users").findOne({ username: req.session.user }, function(err, user) {
				 if (err)
				 {
					console.log(err);
					return;
				 }
				 var uName = req.session.user;
				 var interest = req.body.tagg;
				 var ins = interest.split(/[ ,]+/).filter(Boolean);
				 var obj = {};
				 for (var i = 0; i < ins.length; i++)
				 {
					 if (ins[i][0] != '#')
						ins[i]  = "#" + ins[i];
					 var keyOf  = ins[i];
					 obj[keyOf] = ins[i];
					 // pun tagurile in db aparte [key: tagul, value: [usernameuri]
					 db.collection("taggs").update( {kind: "tagg"}, {$addToSet: { [keyOf]: uName }} );
				 }
				 req.body.tagg = obj;
				 req.body.Gender = (req.session.allData.personal.Gender || req.body.Gender);
				 user.personal = req.body;
				 db.collection("users").update({username: uName}, user);
				 req.session.allData = user;
				 return res.redirect('profile');
			});
		});
	});

	app.listen(8080, function() {
		var time = new Date().toString();
		console.log("Started on PORT 8080 " + time + "on https://matc-ni3k.c9users.io");
	});