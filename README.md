# Foreverize: in Soviet Russia, your server keeps itself up

Foreverize is a handy tool that makes it really easy to your server code to incorporate [forever-monitor](https://github.com/nodejitsu/forever-monitor) automatically.

This version (0.1.x) should be usable, but consider it alpha. Not all use cases have been tested.

Wish list:
  1. zero-downtime restarts


## Install

```bash
$ npm install foreverize
```

## Quick Start

Install required dependencies (or through package.json)

(Installing forever directly is only necessary if you want to use the forever commandline tool to manage your foreverized process)

```bash
$ npm install forever
$ npm install foreverize
```

In your `server.js`

```javascript
var start_server = function(){
  require("http").createServer().listen(1337);
}

var foreverize = require("foreverize")();
if(!foreverize.isMaster){
  start_server();
}
```

Run it

```bash
$ node server.js
```

Now if your HTTP server crashes (anything started in `run_server()`), it'll respawn itself. You can also use the normal
[forever](https://github.com/nodejitsu/forever) commands to manage the process.

```bash
$ node_modules/.bin/forever list
info:    Forever processes running
data:        uid                command                        script                                          forever pid   logfile                                               uptime     
data:    [0] foreverize_example /usr/local/nvm/v0.8.8/bin/node /home/ilya/work/cm/foreverize_example/server.js 26326   26329 /home/ilya/work/cm/foreverize_example/log/forever.log 0:0:0:5.61    
```

## Configuration

By default, foreverize will look for a config file in the following places:

```bash
./config/foreverize.json
./foreverize.json
```

It's also possible to specify the config file at the commandline

```bash
node server.js --foreverize-config /path/to/config.json
```

The configuration file is optional. If specified, it MUST be valid JSON (double quotes, no comments, etc.). Most of the options are passed directly to [forever-monitor](https://github.com/nodejitsu/forever-monitor/blob/master/README.md#options-available-when-using-forever-in-nodejs), but there are a few special cases and defaults.

```javascript
{
  // A shortcut for specifying a log directory relative to your server file.
  // If it doesn't exist, it will be created.
  // outFile (stdout) will get set to #{logDir}/out.log
  // errFile (stderr) will get set to #{logDir}/out.err
  'logDir': 'log/path',

  // appends to your log files instead of overwriting them
  'append': true
}
```

Additional options can also be passed in from your code (and take precedence over default and config file)

```javascript
var foreverize = require("foreverize")({
  logDir: "log"
});
```

## Usage
It is recommened to set the `uid` configuration option in
your app. This way, `foreverize` will make sure that only one instance
of your app is running at a time. This is particularly important if
you use [cluster](http://nodejs.org/api/cluster.html) as cluster will
happily (and silently) run your server on a random port if your desired port is
already in use.

Make that you minimize the code that executes outside the
`if(foreverize.isMaster)` check. If your app crashes here, foreverize
won't be able to start.

## Contributing

I welcome pull requests!

## License

This software is distributed under the MIT License.
