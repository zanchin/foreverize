# Foreverize: in Soviet Russia, your server keeps itself up

Foreverize is a handy tool that makes it really easy to your server code to incorporate [forever-monitor](https://github.com/nodejitsu/forever-monitor) automatically.

This version is going up on github/npm by popular demand, but is in no way ready for the general public yet...

TODO list:
  1. remove `config/forever.json` dependency (possibly put config into package.json)
  1. remove hard-coded log paths
  1. allow full config options that `forever.Monitor` supports
  1. remove all the logging to stdout
  1. cleanup code

Wish list:
  1. zero-downtime restarts


## Install

```bash
$ npm install foreverize
```

## Quick Start

Install required dependencies (or through package.json)

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

Now if your HTTP server crashes, it'll respawn itself. You can also use the normal
[forever](https://github.com/nodejitsu/forever) commands to manage the process.

```bash
$ node_modules/.bin/forever list
info:    Forever processes running
data:        uid                command                        script                                          forever pid   logfile                                               uptime     
data:    [0] foreverize_example /usr/local/nvm/v0.8.8/bin/node /home/ilya/work/cm/foreverize_example/server.js 26326   26329 /home/ilya/work/cm/foreverize_example/log/forever.log 0:0:0:5.61    
```


## Contributing

I welcome pull requests!

## License

This software is distributed under the MIT License.