var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var errorhandler = require("errorhandler");

// app.use(express.methodOverride());
app.use(bodyParser);
app.set("view engine", "jade");
app.set("views", __dirname + "/public");
app.set("view options", { layout: false });
app.set("basepath", __dirname + "/public");

var env = process.env.NODE_ENV || "development";

if ("development" == env) {
  // configure stuff here
  app.use(express.static(__dirname + "/public"));
  app.use(errorhandler({ dumpExceptions: true, showStack: true }));
}

if ("production" == env) {
  var oneYear = 31557600000;
  app.use(express.static(__dirname + "/public", { maxAge: oneYear }));
  app.use(errorhandler());
}

console.log(
  "Web server has started.\nPlease log on http://127.0.0.1:3002/index.html"
);
app.listen(3002);
