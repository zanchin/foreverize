var fs = require('fs');
var util = require('util');
var path = require('path');
var mp = require('./utils').mp;

var default_config_opt_name = "--foreverize-config";

var config_defaults = {
  append: true,
  silent: false
};

function parse_config_file_opt(argv, config_opt_name){
  config_opt_name = config_opt_name || default_config_opt_name;

  var loc = argv.indexOf(config_opt_name);
  if(loc != -1){
    argv.splice(loc, 1);
    var config_file = argv[loc];
    if(config_file)
      argv.splice(loc, 1);
  }
  return config_file;
}

var default_config_file = 'foreverize.json';
var config_file_locations = ['./config/', '.'];

//or: function load_config(options)
function load_config(config_file, options){
  if( typeof(config_file) === "object" ){
    options = config_file;
    config_file = undefined;
  }

  var config = {};
  options = options || {};

  // load the specified config file. If not given, check:
  //  - commandline args
  //  - default locations

  if(!config_file){
    config_file = parse_config_file_opt(process.argv);
  }

  if(!config_file){
    for(var i in config_file_locations){
      var check_path = path.join(config_file_locations[i], default_config_file);
      if(fs.existsSync(mp(check_path))){
        config_file = check_path;
        break;
      }
    }
  }

  try {
    if(config_file){
      config_file = mp(config_file);
      config = require(config_file);
    }
  } catch(e){
    console.error(util.format("Could not load config file '%s': %s", config_file, e));
    config = null;
  }

  // merge in passed-in options with config
  for(var opt in options){
    if(options.hasOwnProperty(opt)){
      config[opt] = options[opt];
    }
  }

  return config;
}

function apply_defaults(config){
  config = config || {};

  // special logdir helper
  if(config.logDir){
    // make sure log directory exits
    var logdir = mp(config.logDir);
    try {
      fs.mkdirSync(logdir);
    } catch(e){
      if(e.code != "EEXIST"){
        console.error(util.format("WARNING: failed to create log dir '%s': %s", logdir, e));
      }
    }

    config.logFile = path.join(logdir, 'forever.log'); // doesn't do anything in non-deamonized mode
    config.outFile = path.join(logdir, 'out.log');
    config.errFile = path.join(logdir, 'out.err');
  }

  for(var opt in config_defaults){
    if( config_defaults.hasOwnProperty(opt) && !config[opt] ){
      config[opt] = config_defaults[opt];
    }
  }

  return config;
}

module.exports = exports = {
  config_defaults: config_defaults,
  default_config_opt_name: default_config_opt_name,
  parse_config_file_opt: parse_config_file_opt,
  load_config: load_config,
  apply_defaults: apply_defaults
}