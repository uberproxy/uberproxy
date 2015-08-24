'use strict';

var Mkdir  = require('mkdirp');
var Path   = require('path');
var FUtil  = require('./file-util');

function Store(file, defaultValues) {
    this._file   = file;
    this._data   = defaultValues || {};
    this._dirty  = true;
    this.read();
    this.sync();
}

Store.prototype.sync = function() {
    setTimeout(function() {
        this.write();
    }.bind(this), 1000);
};

Store.prototype.read = function() {
    try  {
        var obj = FUtil.read(this._file);
        for (var i in obj) {
            if (obj.hasOwnProperty(i)) {
                this._data[i] = obj[i];
            }
        }
    } catch (e) {
    }
};

Store.prototype.write = function() {
    if (!this._dirty) return this.sync();
    this._dirty = false;
    FUtil.write(this._file, this._data, function(err) {
        this.sync();
    }.bind(this));

};

Store.prototype.set = function(key, value) {
    this._data[key] = value;
    this._dirty = true;
    return this;
};

Store.prototype.get = function(key) {
    return this._data[key] || null;
};

var config = process.env.UBERPROXY_CONFIG || process.cwd() + "/config.yml";
if (process.configPath) {
    config = process.configPath;
}

// Make sure config it exists
var Config = FUtil.read(config);

Config.parseArgv = function(argv) {
    var map = {
        'http_port': ['port'],
        'https_port': ['ssl', 'port'],
        'workers': ['cluster'],
    };
    for (var i in map) {
        if (argv[i] === undefined || argv[i] === null) continue;
        var l = Config;
        map[i].slice(0,-1).forEach(function(v) {
            l = l[v];
        });
        l[ map[i].pop() ] = argv[i];
    }
};

Config.applyDefaults = function() {
    var map = {
        '/config/dynamic.yml': ['dynamic'],
        '/config/ssl': ['ssl', 'certs'],
        '443': ['ssl', 'port'],
        '80': ['port'],
        '4': ['cluster'],
    };

    for (var i in map) {
        var l = Config;
        map[i].slice(0,-1).forEach(function(v) {
            l = l[v];
        });
        var c = map[i].pop()
        if (null == l[ c ]) {
            l[ c ] = i;
        }
    }
};

Config.applyEnv = function() {
    var map = {
        'UBERPROXY_DYNAMIC': ['dynamic'],
        'UBERPROXY_SSL_CERTS': ['ssl', 'certs'],
        'UBERPROXY_SECRET': ['secret'],
        'UBERPROXY_CLUSTER': ['cluster'],
    };
    for (var i in map) {
        if (process.env[i] === undefined || process.env[i] === null) continue;
        var l = Config;
        map[i].slice(0,-1).forEach(function(v) {
            l = l[v];
        });
        l[ map[i].pop() ] = process.env[i];
    }
};

Config.applyDefaults();
Config.applyEnv();

['secret'].forEach(function(v) {
    if (!Config.hasOwnProperty(v)) {
        throw new Error("Missing property " + v + " in " + config + " file");
    }
});

var mode = parseInt('0600',8)
Mkdir.sync(Path.dirname(Config.ssl.certs), {mode: mode});
Mkdir.sync(Path.dirname(Config.dynamic), {mode: mode});

var Dynamic = new Store(Config.dynamic);
Config.set = Dynamic.set.bind(Dynamic);
Config.get = Dynamic.get.bind(Dynamic);

module.exports = Config;
