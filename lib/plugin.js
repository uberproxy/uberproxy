'use strict';

var Fs  = require('fs');
var Cluster  = require('cluster');
var Config   = require('../lib/config');
var plugins = {}

exports.list = function() {
    return Object.keys(plugins.objects);
};

function loadPlugin(name, path, proxy) {
    var plugin = require(path || name).plugin;
    if (typeof plugin !== "function" || plugins[name]) {
        if (plugin instanceof Array) {
            plugin.forEach(function(def) {
                loadPlugin(def[0], def[1], proxy);
            });
        }
        return;
    }
    
    plugins[name] = {object: plugin, path: path};
    plugin(proxy, Config);
}

exports.register = function(plugin, worker) {
    if (typeof worker === "object" && worker.constructor.name !== "Worker") {
        throw new Error("Invalid call, it was expecting a worker object");
    }

    if (!plugins[plugin]) {
        throw new Error("Cannot find plugin " + plugin + ". We have these plugins: " + Object.keys(plugins).join(", ") );
    }

    plugins[plugin].object(worker, Config);
};

/**
 *  Load and initialize all the applications
 */
exports.load = function(proxy) {
    Fs.readdirSync(__dirname + "/../plugins").forEach(function(file) {
        loadPlugin(file.replace(/\..+$/, ''), __dirname + "/../plugins/" + file, proxy);
    });
};

