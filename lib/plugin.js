'use strict';

var Fs = require('fs');
var plugins = {};

exports.list = function() {
    return Object.keys(plugins);
};

exports.register = function(plugin, worker) {
    if (typeof worker === "object" && worker.constructor.name !== "Worker") {
        throw new Error("Invalid call, it was expecting a worker object");
    }

    if (!plugins[plugin]) {
        throw new Error("Cannot find plugin " + plugin);
    }

    plugins[plugin](worker);
};

/**
 *  Load and initialize all the applications
 */
exports.load = function(proxy) {
    Fs.readdirSync(__dirname + "/../plugins").forEach(function(file) {
        var plugin = require(__dirname + "/../plugins/" + file).plugin;
        if (typeof plugin == "function") {
            plugins[file.replace(/\..+$/, '')] = plugin;
            plugin(proxy);
        }
    });
};

