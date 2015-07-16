var Events = require('async-eventemitter');
var Https  = require('./https');
var Http   = require('http');
var Util   = require('util');
var Config = require('./config');
var Worker = require('./worker');
var Fs     = require('fs');
var Plugin = require('./plugin');
var Hub    = require('cluster-hub');

process.Hub = new Hub;

function val(obj) {
    var arr = [];
    for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
            arr.push(obj[i]);
        }
    }
    return arr;
}

function Proxy() {
    this.htmls = {};
    var files = Fs.readdirSync(__dirname + "/../html");
    for (var i in files) {
        if (files.hasOwnProperty(i)) {
            this.htmls[files[i].replace(/\..+$/, '')] = Fs.readFileSync(__dirname + "/../html/" + files[i]);
        }
    }
    this._hosts = [];
    this._hexpr = /^$/;
    this._rules = {};
    this._apps  = {};
    this._queue = {};
    this._raw   = {};
    this.temp   = "/tmp/uberproxy";
    this._workers = {};

    Fs.mkdir(this.temp, function(e) {
        if (e && e.code !== 'EEXIST') throw e;
    });

    Plugin.load(this);

    var apps = Config.workers || [];
    apps     = apps.concat(Config.get('workers') || []);
    for (var i in apps) {
        if (apps.hasOwnProperty(i)) {
            this.register(apps[i]);
        }
    }

    var certs  = Config.https || {};
    var certs2 = Config.get('https') || {};
    for (var i in certs2) {
        if (certs2.hasOwnProperty(i)) {
            certs[i] = certs2[i];
        }
    }
    for (var domain in certs) {
        if (certs.hasOwnProperty(domain)) {
            try {
                Https.registerDomain(domain, certs[domain][0], certs[domain][1]);
            } catch(e) {
                console.error("Failed to regiter ssl-cert for ", domain);
            }
        }
    }
    Events.call(this);
};
Util.inherits(Proxy, Events);

Proxy.prototype.deregister = function(app) {
    if (!(app instanceof Worker)) throw new Error("Unexpected argument");
    delete this._raw[app.appId];
    delete this._workers[app.getId()];
    Config.set('workers', val(this._raw));
    if (this._apps[app.appId]) {
        var id = this._apps[app.appId].indexOf(app);
        this._apps[app.appId].splice(id, 1);
        if (this._apps[app.appId].length == 0) {
            delete this._apps[app.appId];
            delete this._rules[app.appId];
        }
    }
    var hosts = [];
    for (var i in this._apps) {
        if (this._apps.hasOwnProperty(i)) {
            for (var e in this._apps[i]) {
                if (this._apps[i].hasOwnProperty(e)){
                    hosts = hosts.concat(this._apps[i][e].getHosts());
                }
            }
        }
    }

    this._hosts = hosts;
    this._hexpr = new RegExp("^(?:" + hosts.join("|") + ")$", "i");
    app.destroy();
    app = null;
};

Proxy.prototype.register = function(obj) {
    var app = new Worker(obj, this);

    if (this._workers[app.getId()]) {
        this.deregister(this._workers[app.getId()]);
    }

    this._raw[app.appId] = obj;
    Config.set('workers', val(this._raw));

    if (!this._apps[app.appId]) {
        this._apps[app.appId]  = [];
        this._rules[app.appId] = new RegExp("^(?:" + app._hostname.join("|") + ")$", "i");
    }

    this._apps[app.appId].push(app);
    this._hosts = this._hosts.concat(app.getHosts());
    this._hexpr = new RegExp("^(?:" + this._hosts.join("|") + ")$", "i");
    this._workers[app.getId()] = app;
};

Proxy.prototype.queue = function(id, conn) {
    if (!this._queue[id]) {
        this._queue[id] = [];
    }
    this._queue[id].push(conn);
};

Proxy.prototype.forward = function(conn) {
    if (this._hexpr.exec(conn.host)) {
        for (var i in this._rules) {
            if (this._rules[i].exec(conn.host) && this._apps[i][0]._routes.exec(conn.pathname)) {
                /* Select a worker randomly */
                var rnd = Math.round(Math.random() * (this._apps[i].length-1));
                if (this._apps[i][rnd].isEnable()) {
                    return this._apps[i][rnd].forward(conn);
                }
    
                /* Selected worker is busy, go one by one */
                for (rnd = 0; rnd < this._apps[i].length; rnd++) {
                    if (this._apps[i][rnd].isEnable()) {
                        return this._apps[i][rnd].forward(conn);
                    }
                }
    
                /* Queue the request */
                return this.queue(i, conn);
            }
        }
    }

    conn.response(404).end(this.htmls['not-found'] || "Page Not Found");
};

Proxy.prototype.requestEnd = function(appId, requestId) {
    if (this._queue[appId] && this._queue[appId].length > 0) {
        var w = this._queue[appId].shift();
        this.forward(w);
    }
};

Proxy.prototype.hasDomain =  function(domain) {
    return this._hexpr.exec(domain);
};

module.exports = new Proxy;
process.Proxy  = module.exports;
