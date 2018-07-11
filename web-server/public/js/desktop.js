require.config({
  paths: {
    jquery: "libs/jquery",
    underscore: "libs/underscore",
    backbone: "libs/backbone-min",
    bootstrap: "libs/bootstrap.min",
    pomeloclient: "libs/pomeloclient",
    socketio: "libs/socket.io",
    resources: "libs/resources"
  },
  shim: {
    bootstrap: {
      deps: ["jquery"]
    },
    backbone: {
      deps: ["bootstrap", "pomeloclient", "socketio"]
    }
  }
});

// first argument is dependencies, second parameter is a callback loaded after dependencies acquired
// function takes jquery, backbone and desktopRouter as arguments and sets router property of desktopRouter
require([
  "jquery",
  "backbone",
  "routers/desktopRouter",
  "bootstrap",
  "resources"
], function($, Backbone, Desktop) {
  this.router = new Desktop();
  // router is the Router object returned by desktopRotuer
});
