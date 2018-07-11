var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var errorhandler = require("errorhandler");

// get environment variables
require("dotenv").config();
var env = process.env.NODE_ENV;

// app.use(express.methodOverride()); // would have been used to allow usage of HTTP verbs like PUT or DELETE in clients (browsers) that don't support it

app.use(express.json()); // bodyparser middleware parses body into req.body
app.use(
  express.urlencoded({
    extended: true
  })
); // bodyparser like middleware parses incoming request uri into urlencoded
app.set("view engine", "pug"); // using the pug(jade) templating engine
app.set("views", __dirname + "/public"); // don't know if this is being used
app.set("view options", { layout: false });
app.set("basepath", __dirname + "/public");

// if in development
if ("development" == env) {
  app.use(express.static(__dirname + "/public")); // serve static html css
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
