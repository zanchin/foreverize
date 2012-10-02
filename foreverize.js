var util = require('util');
var fs = require('fs');
var path = require('path');
var events = require('events');
var forever = require('forever');

var slog = require ('./lib/logger').slog;

var foreverize = function(options){
  // slog("foreverize before start_forever");

 if(process.env.SPAWNED_BY_FOREVER === "true"){
    // slog("I'm a forever subprocess");
    return foreverize;
  }

  // slog("I'm a forever MASTER");

  var mp = require('./lib/utils').mp;
  var config = require('./lib/config');

  // autodetect calling script
  var script_file = getCalleeFile();

  // local config (gets config file name from argv or default locations)
  var forever_config = config.load_config(options);

  if(forever_config.script){
    // console.log("switching script to:", forever_config.script);
    script_file = mp(forever_config.script);
  }

  process.chdir(path.dirname(script_file));
  // console.log("using script:", script_file);

  // update config with our own overrides
  forever_config.env = forever_config.env || {};
  forever_config.env.SPAWNED_BY_FOREVER =  "true";
  forever_config.options =  process.argv.slice(2); // pass on commandline args transparently

  forever_config = config.apply_defaults(forever_config);
  // slog("config:", util.inspect(forever_config));

  // slog("starting Monitor:", script_file);
  var start = function(){
    var monitor = new (forever.Monitor)(script_file, forever_config);

    monitor.on('exit', function(){
      console.error("Monitored " + script_file + " exited");
    });

    monitor.start();
    forever.startServer(monitor);
  };

  // make sure only one cluster process with this uid is running
  forever.list(null, function(err, processes){
    if(err){
      return console.error("Failed to get listing of forever processes:", err);
    } else if(processes && processes.forEach) {
      processes.forEach(function(p){
        if( p.uid === forever_config.uid ){
          throw new Error("A forever process with uid '" + p.uid +
                          "' is already running:\n" + util.inspect(p, null, 1));
        }
      });
    }

    start();
  });

  return foreverize;
};

function getCalleeFile(){
  return process.argv[1];

  // var callee_file;
  // return function(){
  //   if(callee_file){
  //     // console.log("returning memoized:", callee_file);
  //     return callee_file;
  //   }

  //   require("callsite");
  //   var filename, me, stack = __stack;

  //   // console.log(stack.map(function(s){return s.getFileName();}).join("\n"));

  //   for(var i = 0; i < stack.length; i++){
  //     filename = stack[i].getFileName();
  //     if( filename != 'module.js' ){
  //       if( me && me != filename ){
  //         callee_file = filename;
  //         // console.log("callee filename: ", filename);
  //         return filename;
  //       } else {
  //         me = filename;
  //       }
  //     }
  //   };
  //   return null;
  // }();
}

foreverize.isMaster = foreverize.isMonitor = process.env.SPAWNED_BY_FOREVER !== "true";

module.exports = foreverize;
