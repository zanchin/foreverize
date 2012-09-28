var util = require('util');
var fs = require('fs');
var path = require('path');
var forever = require('forever');

var slog = require ('./logger').slog;

// local config
var config_file = 'config/forever.json';
var forever_config;

function load_config(){
  try {
    config_file = mp(config_file);
    forever_config = require(config_file);
  } catch(e){
    console.error(util.format("Could not load config file '%s': %s", config_file, e));
    process.exit(1);
  }
}

// boiler-plate stuff

function mp(relpath){
  // make abs path
  var parent = process.cwd();
  return path.join( parent, relpath );
}

var start_forever = function(start_func){
  slog("foreverize before start_forever");

  if(process.env.SPAWNED_BY_FOREVER === "true"){
    slog("I'm a forever subprocess, calling start_func");
    start_func && start_func();
    return start_forever;
  }

  slog("I'm a forever MASTER");

  var script_file = getCalleeFile();

  // change directory to the child script location
  process.chdir(path.dirname(script_file));

  load_config();

  if(forever_config.script){
    console.log("switching scrip to:", forever_config.script);
    script_file = mp(forever_config.script);
  }

  slog("starting Monitor:", script_file);


  var start = function(){
    // make sure log directory exits
    var logdir = mp('log');
    try {
      fs.mkdirSync(logdir);
    } catch(e){
      if(e.code != "EEXIST"){
        slog(util.format("WARNING: failed to create log dir '%s': %s", logdir, e));
      }
    }

    var child = new (forever.Monitor)(script_file, {
      env: {
        SPAWNED_BY_FOREVER: "true"
      },
      max: 3,
      uid: forever_config.uid,
      append: true,
      silent: false,
      command: forever_config.command,
      pidFile: mp('pids/app.pid'),
      logFile: path.join(logdir, 'forever.log'), // doesn't do anything in non-deamonized mode
      outFile: path.join(logdir, 'out.log'),
      errFile: path.join(logdir, 'out.err'),
      options: process.argv.slice(2) // pass on commandline args transparently
    });

    child.on('exit', function(){
      slog("child " + script_file + " exited");
    });

    child.start();
    forever.startServer(child);
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

  return start_forever;
};

start_forever.isMaster = process.env.SPAWNED_BY_FOREVER !== "true";


function getCalleeFile(){
  var callee_file;
  return function(){
    if(callee_file){
      console.log("returning memoized:", callee_file);
      return callee_file;
    }

    require("callsite");
    var filename, me, stack = __stack;

    // console.log(stack.map(function(s){return s.getFileName();}).join("\n"));

    for(var i = 0; i < stack.length; i++){
      filename = stack[i].getFileName();
      if( filename != 'module.js' ){
        if( me && me != filename ){
          callee_file = filename;
          console.log("callee filename: ", filename);
          return filename;
        } else {
          me = filename;
        }
      }
    };
    return null;
  }();
}


module.exports = start_forever;
