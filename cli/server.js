var Fs = require('fs');

function setup(parser) {
    parser.addArgument(
        ['-c', '--config'],
        {
            action: 'store',
            type: function(f) {
                Fs.statSync(f);
                process.configPath = f;
                return f;
            },
            help: 'Configuration file',
        }
    );
    parser.addArgument(
        ['-w', '--worker'],
        {
            action: 'store',
            type: 'int',
            help: 'Number of workers to use',
        }
    );
    parser.addArgument(
        ['-p', '--http-port'],
        {
            action: 'store',
            type: 'int',
            help: 'Http-Port to listen to',
        }
    );
    parser.addArgument(
        ['-s', '--https-port'],
        {
            action: 'store',
            type: 'int',
            help: 'Https-Port to listen to',
        }
    );
}

function main(argv) {
    var Https    = require('https');
    var Cluster  = require('cluster');
    var Http     = require('http');
    var Proxy    = require('../lib/proxy');
    var Commands = require('../lib/commands');
    var Config   = require('../lib/config');
    var Conn     = require('../lib/connection');
    var Plugin   = require('../lib/plugin');

    Config.parseArgv(argv);

    if (Cluster.isMaster && Config.cluster > 0) {
        var numCPUs = parseInt(Config.cluster);
        for (var i = 0; i < numCPUs; i++) {
            Cluster.fork();
        }

        Cluster.on('exit', function(worker, code, signal) {
            console.log('worker ' + worker.process.pid + ' died');
            Cluster.fork();
        });

        Cluster.on('online', function(worker) {
            console.log("New worker [" + worker.process.pid + "]");
        });
        
        console.log("Http-Listening in port " + Config.port);
        console.log("Https-Listening in port " + Config.ssl.port);
        return;
    } else if (!Cluster.isWorker) {
        console.log("Http-Listening in port " + Config.port);
        console.log("Https-Listening in port " + Config.ssl.port);
    }
    
    function handleRequest(protocol, req, res) {
        var conn = new Conn(protocol, req, res);
        if (conn.done) {
            /* already handled! */
            return;
        }
    
        if (!Commands.is(conn)) {
            Proxy.forward(conn);
        }
    }
    
    Http.createServer(handleRequest.bind(null, 'http:')).listen(Config.port);
    Https.createServer(
        require('../lib/https').options,
        handleRequest.bind(null, 'https:')
    ).listen(Config.ssl.port);
};

exports.main = main;
exports.setup   = setup;
