var Proxy    = require('./lib/proxy');
var Https    = require('https');
var Http     = require('http');
var Commands = require('./lib/commands');
var Config   = require('./lib/config');
var Conn     = require('./lib/connection');
var Cluster  = require('cluster');

if (Cluster.isMaster && Config.cluster > 0) {
    var numCPUs = Config.cluster;
    for (var i = 0; i < numCPUs; i++) {
        Cluster.fork();
    }
    Cluster.on('exit', function(worker, code, signal) {
        console.log('worker ' + worker.process.pid + ' died');
        Cluster.fork();
    });

    console.log("Http-Listening in port " + Config.port);
    console.log("Https-Listening in port " + Config.ssl.port);
    return;
} else if (!Cluster.isWorker) {
    console.log("Http-Listening in port " + Config.port);
    console.log("Https-Listening in port " + Config.ssl.port);
}

function handleRequest(req, res) {
    var conn = new Conn(req, res);
    if (conn.done) {
        /* already handled! */
        return;
    }

    if (!Commands.is(conn)) {
        Proxy.forward(conn);
    }
}

Http.createServer(handleRequest).listen(Config.port);
Https.createServer(require('./lib/https').options, handleRequest).listen(Config.ssl.port);
