var express = require("express");

var dataFunctions = require('./dataFunctions.js');

var app = express();
var router = express.Router();
//var path = __dirname + '/views/';
var path = __dirname + '/';
 
 
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

/*
dataFunctions.getZip('90210', function(results) {
    //console.log("testFunction = "+jjkFunc.testFunction());
    console.log(results);
});
*/

dataFunctions.loadData();


/*

// Place your settings in this file to overwrite the default settings
{
      "editor.fontSize": 12,
      "git.confirmSync": false,
      "extensions.ignoreRecommendations": false,
      "git.enableSmartCommit": true,
      "files.autoSave": "afterDelay",
      "workbench.startupEditor": "newUntitledFile"
}

// Place your key bindings in this file to overwrite the defaults
[
    {
        "key": "delete",
        "command": "editor.action.clipboardCutAction",
        "when": "editorTextFocus && !editorReadonly"
    },
    {
        "key": "shift+delete",
        "command": "-editor.action.clipboardCutAction",
        "when": "editorTextFocus && !editorReadonly"
    },
    {
        "key": "insert",
        "command": "editor.action.clipboardPasteAction",
        "when": "editorTextFocus && !editorReadonly"
    },
    {
        "key": "shift+insert",
        "command": "-editor.action.clipboardPasteAction",
        "when": "editorTextFocus && !editorReadonly"
    }
]

*/