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

var config = process.cwd() + "/config.yml";
if (process.argv[2]) {
    config = process.argv[2];
}

// Make sure config it exists
var Config = FUtil.read(config);
['ssl', 'dynamic', 'cluster', 'port', 'secret'].forEach(function(v) {
    if (!Config.hasOwnProperty(v)) {
        throw new Error("Missing property " + v + " in " + config + " file");
    }
});

['port', 'certs'].forEach(function(v) {
    if (!Config.ssl.hasOwnProperty(v)) {
        throw new Error("Missing property ssl['" + v + "'] in " + config + " file");
    }
});

Mkdir.sync(Path.dirname(Config.ssl.certs), {mode: 0600});
Mkdir.sync(Path.dirname(Config.dynamic), {mode: 0600});

var Dynamic = new Store(Config.dynamic);
Config.set = Dynamic.set.bind(Dynamic);
Config.get = Dynamic.get.bind(Dynamic);

module.exports = Config;
