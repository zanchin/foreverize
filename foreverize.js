var util = require('util');
var fs = require('fs');
var path = require('path');
var forever = require('forever');

var slog = require ('./logger').slog;

// local config
var config_file = 'config/forever.json';
var forever_config;

try {
  config_file = mp(config_file);
  forever_config = require(config_file);
} catch(e){
  console.error(util.format("Could not load config file '%s': %s", config_file, e));
  process.exit(1);
}

// make sure script exists
forever_config.script = mp(forever_config.script);
if(!fs.existsSync(forever_config.script)){
  console.error(util.format("Couldn't find script file to run: '%s'", forever_config.script));
  process.exit(1);
}

// boiler-plate stuff

function mp(relpath){
  // make abs path
  //return __dirname + '/' + relpath;

  console.log("CWD:", process.cwd());

  var parent;
  if(forever_config && forever_config.script){
    parent = path.resolve(path.dirname(forever_config.script));
  } else {
    parent = path.resolve(path.dirname(getCalleeFile()));
  }
  console.log("parent:", parent);
  return path.join( parent, relpath );
}

slog("foreverize before start_forever");

var start_forever = function(start_func){
  if(process.env.SPAWNED_BY_FOREVER === "true"){
    slog("I'm a forever subprocess, calling start_func");
    start_func && start_func();
    return;
  }

  forever_config.script = getCalleeFile();

  slog("I'm a forever MASTER, starting Monitor:", forever_config.script);

  var start = function(){
    var child = new (forever.Monitor)(forever_config.script, {
      env: {
        SPAWNED_BY_FOREVER: "true"
      },
      max: 3,
      uid: forever_config.uid,
      append: true,
      silent: false,
      command: forever_config.command,
      pidFile: mp('pids/app.pid'),
      logFile: mp('log/forever.log'), // doesn't do anything in non-deamonized mode
      outFile: mp('log/out.log'),
      errFile: mp('log/out.err'),
      options: process.argv.slice(2) // pass on commandline args transparently
    });

    child.on('exit', function(){
      slog("child " + forever_config.script + " exited");
    });

    child.start();
    forever.startServer(child);
  };
  
  // make sure only one cluster process with this uid is running
  forever.list(null, function(err, processes){
    if(err){
      return console.error("Failed to get listing of forever processes:", err);
    } else if(processes) {
      processes.forEach(function(p){
        if( p.uid === forever_config.uid ){
          throw new Error("A forever process with uid '" + p.uid +
                          "' is already running:\n" + util.inspect(p, null, 1));
        }
      });
    }

    start();
  });
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

    console.log(stack.map(function(s){return s.getFileName();}).join("\n"));

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
