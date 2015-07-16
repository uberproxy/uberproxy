var TLS    = require('tls');
var Config = require('./config');
var Fs     = require('fs');

/**
 *  Define the following function in a private context so 
 *  we can protect our certs :-)
 */
(function() {
    var secureContext = {};
    var files = {};

    /**
     *  registerDomain
     *
     *  Create a context from a key/cert files to be used
     *  for the Https server.
     */
    exports.registerDomain = function(domain, key, cert) {
        files[domain] = [key, cert];
        secureContext[domain] =  TLS.createSecureContext({
            key:  Fs.readFileSync(key),
            cert: Fs.readFileSync(cert),
        }).context;
        Config.set('https', files);
        return exports;
    }

    exports.options = {
        /**
         *  This function by the https server, it must return
         *  the context that should be use for this domain
         */
        SNICallback: function (domain, cb) {
            cb(null, secureContext[domain]);
        },
    };
})();
