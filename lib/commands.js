'use strict';

var Crypto = require('crypto');
var Config = require('./config');
var Https  = require('./https');
var Proxy  = require('./proxy');
var Plugin = require('./plugin')
var Fs     = require('fs');

module.exports = (function Commands() {
    var ns = {};
    var secret;

    function sha256(text) {
        secret = secret || Config.secret;
        return Crypto.createHash('sha256')
            .update(secret + "\0")
            .update(text)
            .digest('hex').toLowerCase();
    }

    ns.add_ssl = function(obj, next) {
        var dir = Config.ssl.certs;
        Fs.mkdir(dir, function(err) {
            var key = dir + "/" + obj.domain + ".key";
            var crt = dir + "/" + obj.domain + ".crt";

            var mode = parseInt('0600', 8);
            Fs.writeFileSync(key, obj.key);
            Fs.writeFileSync(crt, obj.cert);
            Fs.chmodSync(key, mode);
            Fs.chmodSync(crt, mode);

            Https.registerDomain(obj.domain, key, crt);
            next();
        });
    };

    ns.info = function(obj, next) {
        next(null, {
            plugins: Plugin.list(),
            hosts: process.Proxy._hosts,
        });
    };

    ns.ping = function(obj, next) {
        next(null, { pong: true, time: new Date });
    };

    ns.deregister = function(obj, next) {
        Proxy.deregister(Proxy.find_worker(obj.host, obj.worker));
        next();
    };

    ns.register = function(obj, next) {
        Proxy.register(obj);
        next();
    };

    function wrap(i) {
        return function(obj) {
            return ns[i](obj, function() {});
        };
    }

    for (var i in ns) {
        if (ns.hasOwnProperty(i)) {
            process.Hub.on('command:' + i, wrap(i));
        }
    }

    var filter = new RegExp("^/_uberproxy/(" + Object.keys(ns).join("|") + ")/?$");
    ns.is = function(conn) {
        var data = "";
        var action;

        if (!(conn.headers['x-auth']||"").match(/^[a-f0-9]{64}$/i) || !(action=conn.url.match(filter))) {
            return false;
        }

        conn.req.on('data', function(body) {
            data += body.toString();
        });

        conn.req.on('end', function() {
            if (conn.headers['x-auth'].toLowerCase() !== sha256(action[1] + "\0" + data)) {
                return conn.json({error: true, exception: "Unauthorized request"}, 500);
            }

            try {
                var obj = data ? JSON.parse(data) : undefined;
                ns[action[1]](obj, function(error, zdata) {
                    if (!error) process.Hub.sendToWorkers('command:' + action[1], obj);
                    zdata = zdata || {};
                    zdata['error'] = !!error;
                    conn.json(zdata);
                });
            } catch (e) {
                conn.json({error: true, exception: e+""}, 500);
            }
        });

        return true;
    };

    return ns;
})();

