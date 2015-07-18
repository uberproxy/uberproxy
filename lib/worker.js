'use strict';

var Http = require('http');
var Util = require('util');
var Plugin = require('./plugin');
var Events = require('async-eventemitter');
var UUID   = require('node-uuid');
var Crypto = require('crypto');
var URL  = require('url');

// Thanks Internet for so much love
// http://stackoverflow.com/a/2593661/1608408
function RegexQuote(str) {
    return (str+'').replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
}

function id(str) {
    return Crypto.createHash('sha256')
        .update(str)
        .digest('hex').substr(0, 12);
}

/**
 *  Worker
 *
 *  A worker of an application. It contains all the rules to 
 *  to forward a request from the proxy to an application.
 *
 *  A worker is a bit different than you may expected, it can forward
 *  more than a request (It have a soft-limit of default 20).
 */
function Worker(obj, apps) 
{
    ['worker', 'hostname'].forEach(function(val) {
        if (!obj[val]) {
            throw new Error("Missing property: " + val);
        }
    });

    if (typeof obj.hostname === "string") {
        obj.hostname = [obj.hostname];
    }

    var routesRegex = [];
    if (obj.routes instanceof Array) {
        obj.routes.forEach(function(r) {
            routesRegex.push("^" + RegexQuote(r) + "$");
        });
    }
    if (obj.routes_regex instanceof Array) {
        obj.routes_regex.forEach(function(r) {
            // Make sure it's a valid regex, 
            // otherwise an exception will be thrown
            new RegExp(r);
            routesRegex.push(r);
        });
    }

    // Make sure each domain name is a valid RegExp
    obj.hostname.forEach(function(domain) {
        new RegExp("^" + domain + "$");
    });

    var client = (obj.worker||"").split(/:/);
    var rewriteHost = null;
    var rewriteRoutes = [];

    if (typeof obj.rewrite == "object") {
        if (obj.rewrite.routes instanceof Object) {
            for (var route in obj.rewrite.routes) {
                if (obj.rewrite.routes.hasOwnProperty(route)) {
                    rewriteRoutes.push([
                        new RegExp(route, "i"),
                        URL.parse(obj.rewrite.routes[route]),
                    ]);
                }
            }
        }
        if (typeof obj.rewrite.host == "string") {
            rewriteHost = obj.rewrite.host;
        }
    }

    this.extra     = obj.extra || {};
    this._hostname = obj.hostname.sort();
    this._rewrite  = { host: rewriteHost, routes: rewriteRoutes };
    this._routes   = new RegExp("(?:" + routesRegex.join("|") + ")", "i");
    this._workerAddr   = client[0];
    this._port     = parseInt(client[1] || 80);
    this._maxreq   = parseInt(obj.maxreq || 20);
    this.address   = this._workerAddr + ":" + this._port;
    this.appId     = this.getAppName();
    this.id        = obj.name || this.appId;
    this.errors    = 0;

    if (obj.plugins instanceof Array) {
        for (var i in obj.plugins) {
            if (obj.plugins.hasOwnProperty(i)) {
                Plugin.register(obj.plugins[i], this);
            }
        }
    }
    Events.call(this);
}
Util.inherits(Worker, Events);

/**
 *  Return a hash which identify the application of this Worker
 */
Worker.prototype.getAppName = function() {
    return id("(" + this._hostname.join("|") + ")\0" + this._routes);
};

/**
 *  Return a worker-ID (unique)
 */
Worker.prototype.getId = function() {
    return this.appId + "\0" + this._workerAddr;
};

/**
 *  Get all hostnames this application cares.
 */
Worker.prototype.getHosts = function() {
    return this._hostname;
};

/**
 *  There was an error
 */
Worker.prototype._err_handler = function(conn, e) {
    Proxy.emit('response', conn, 500, this);
    this.emit('response', conn, 500, this);
    res.writeHeader(500, res.headers);
    res.end(Proxy.htmls['error'] || "Error");
    this._end_request();
    if (++this.errors >= 10) {
        // so long and thanks for all the fish!
        Proxy.deregister(this);
    }
};

/**
 *  RewriteURL
 *
 *  If the worker have a rule to rewrite URLs, this function would
 *  take care of this.
 */
Worker.prototype.rewriteUrl = function(url) {
    var url = URL.parse(url);
    var nurl;
    for (var i in this._rewrite.routes) {
        if (this._rewrite.routes.hasOwnProperty(i)) {
            if (this._rewrite.routes[i][0].exec(url.pathname)) {
                nurl = URL.parse(url.pathname.replace(this._rewrite.routes[i][0], this._rewrite.routes[i][1].path));
                url.pathname = nurl.pathname;
                if (nurl.query) {
                    url.query = (nurl.query||"") + "&" + (url.query||"");
                }
                break;
            }
        }
    }
    return url.pathname + (url.query ? "?" + url.query : '');
};

/**
 *  Destroy application instance
 */
Worker.prototype.destroy = function() {
    this.removeAllListeners();
};

/**
 *  Construct a request object to forward the current request.
 */
Worker.prototype.getClient = function(req, res) {
    var request = {
        hostname:   this._workerAddr,
        port:       this._port,
        method:     req.method,
        path:       this.rewriteUrl(req.url),
        headers:    req.headers,
    };

    request.headers['host'] = this._rewrite.host || req.headers['host'];
    request.headers['X-Forwarded-For'] = req.connection.remoteAddress;
    request.headers['X-Request-Id']    = req.reqid;

    var client = Http.request(request, this._req_handler.bind(this, req, res))
        .on('error', this._err_handler.bind(this, req, res));

    return client;
};

Worker.prototype.isEnable = function() {
    return this._maxreq > 0;
};

/**
 *  Forward the request to the application's worker
 */
Worker.prototype.forward = function(conn) {
    conn.worker = this;
    process.Proxy.emit('preforward', conn, function() {
        if (conn.done) return;
        conn.worker.emit('preforward', conn, function() {
            if (conn.done) return;
            conn.slotid = --conn.worker._maxreq;
            conn.forwardTo(conn.worker);
        });
    });
};

module.exports = Worker;
