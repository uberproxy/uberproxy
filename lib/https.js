'use strict';

var TLS    = require('tls');
var Https  = require('https');
var Config = require('./config');
var Fs     = require('fs');

/**
 *  Define the following function in a private context so 
 *  we can protect our certs :-)
 */
(function() {
    var secureContext = {};
    var files = {};
    var callback;
    var port;

    var options = {
        /**
         *  This function by the https server, it must return
         *  the context that should be use for this domain
         */
        SNICallback: function (domain, cb) {
            cb(null, secureContext[domain]);
        },
        key: null,
        cert: null,
    };

    /**
     *  registerDomain
     *
     *  Create a context from a key/cert files to be used
     *  for the Https server.
     */
    exports.registerDomain = function(domain, key, cert) {
        files[domain] = [key, cert];
        var keyContent  = Fs.readFileSync(key);
        var certContent = Fs.readFileSync(cert);
        secureContext[domain] =  TLS.createSecureContext({
            key:  keyContent,
            cert: certContent
        }).context;

        if (!options.key) {
            options.key  = keyContent;
            options.cert = certContent;
            console.log("Https-Listening in port " + port);
            Https.createServer(callback).listen(port);
        }

        Config.set('https', files);
        return exports;
    }

    exports.createServer = function(_callback, _port) {
        callback = _callback;
        port     = _port;
    };

})();
