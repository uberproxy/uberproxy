'use strict';

var URL = require('url');

function redirect(Worker) {
    if (Worker.constructor.name !== 'Worker') {
        return;
    }
    var redirect = Worker.extra.redirectTo;
    if (!redirect) {
        throw new Error("redirect plugin expects a redirectTo argument");
    }
    var rParts = URL.parse(redirect[0]);
    var base = (rParts.protocol||"http:") + "//" + rParts.hostname
    var code = redirect[1] || 302;

    Worker.on('preforward', function(conn) {
        var newUrl = base + conn.url;
        conn.response(code, {Location: newUrl})
            .end("Redirect to " + newUrl);
    });
}


exports.plugin = redirect;
