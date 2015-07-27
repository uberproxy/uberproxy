'use strict';

var Fs  = require('fs');
var Cluster  = require('cluster');
var Config   = require('../lib/config');
var NPM = require('npm');
var plugins = {}

exports.list = function() {
    return Object.keys(plugins.objects);
};

function loadPlugin(name, path, proxy) {
    var plugin = require(path || name).plugin;
    if (typeof plugin !== "function" || typeof process.Hub === "undefined" || plugins[name]) {
        return;
    }
    
    if (Cluster.isMaster) {
        process.Hub.sendToWorkers('proxy:register', [name, path]);
    } else {
        plugins[name] = {object: plugin, path: path};
        plugin(proxy);
    }
}

function checkPackage(pkg, proxy) {
    if (pkg['uberproxy-plugin']) {
        loadPlugin(pkg.name, pkg.realPath, proxy);
    }
};

exports.register = function(plugin, worker) {
    if (typeof worker === "object" && worker.constructor.name !== "Worker") {
        throw new Error("Invalid call, it was expecting a worker object");
    }

    if (!plugins[plugin]) {
        throw new Error("Cannot find plugin " + plugin);
    }

    plugins[plugin].object(worker);
};

exports.broadcast = function() {
    for (var name in plugins) {
        process.Hub.sendToWorkers('proxy:register', [name, plugins[name].path]);
    }
};

/**
 *  Load and initialize all the applications
 */
exports.load = function(proxy) {
    if (Cluster.isWorker) {
        process.Hub.on('proxy:register', function(info) {
            loadPlugin(info[0], info[1], proxy);
        });
        return;
    }

    Fs.readdir(__dirname + "/../plugins", function(err, files) {
        (files||[]).forEach(function(file) {
            loadPlugin(file.replace(/\..+$/, ''), __dirname + "/../plugins/" + file, proxy);
        });
    });
    NPM.load(function() {
        NPM.commands.list([], true, function(err, npm) {
            NPM.config.set("global", true);
            for (var i in npm.dependencies) {
                if (npm.dependencies.hasOwnProperty(i)) {
                    checkPackage(npm.dependencies[i], proxy);
                }
            }
            NPM.commands.list([], true, function(err, npm) {
                for (var i in npm.dependencies) {
                    if (npm.dependencies.hasOwnProperty(i)) {
                        checkPackage(npm.dependencies[i], proxy);
                    }
                }
            });
        });
    });
};

