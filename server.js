/*==============================================================================
(C) Copyright 2017 John J Kauflin, All rights reserved. 
-----------------------------------------------------------------------------
DESCRIPTION: NodeJS server for JohnBot2 to run a web app and the
             communications to the Arduino Mega robot
-----------------------------------------------------------------------------
Modification History
2017-09-23 JJK  Initial version to test web app and connection to arduino
2017-11-12 JJK  Got the Elasticsearch data source working for responses
=============================================================================*/

var express = require('express');
var dateTime = require('node-datetime');
var dataFunctions = require('./dataFunctions.js');
//var botFunctions = require('./botFunctions.js');

var app = express();
var router = express.Router();
//var path = __dirname + '/views/';
var path = __dirname + '/';

// General handler for any uncaught exceptions
process.on('uncaughtException', function (er) {
	console.log("UncaughtException, error = "+er);
	console.error(er.stack);
	// Stop the process
	process.exit(1);
});

 
app.use(express.static('public'))
 
/*
router.use(function (req,res,next) {
  console.log("/" + req.method);
  next();
});
 
router.get("/",function(req,res){
  //res.sendFile(path + "index.html");
  res.sendFile('index.html', { root: __dirname });
});
 
router.get("/about",function(req,res){
  res.sendFile(path + "about.html");
});
 
router.get("/contact",function(req,res){
  res.sendFile(path + "contact.html");
});
 
app.use("/",router);
*/
 
/*
app.use("*",function(req,res){
  console.log("Not in Public, URL = "+req.url);
  res.sendFile(path + "404.html");
});
*/
 
// jjk new
app.use(function (err, req, res, next) {
  console.error(err.stack)
  res.status(500).send('Something broke!')
})
 
app.listen(3000,function(){
  console.log("Live at Port 3000 - Let's rock!");
});

dataFunctions.loadData();

var searchStr = 'do you love me';
//var searchStr = 'zzz';
dataFunctions.searchResponses(searchStr, function(results) {
    console.log("return from searchResponses "+dateTime.create().format('Y-m-d H:M:S'));
    console.log(results);
});


console.log("End of server "+dateTime.create().format('Y-m-d H:M:S'));
//dataFunctions.loadData();
//dataFunctions.esInfo();

