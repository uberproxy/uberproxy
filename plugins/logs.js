var Winston = require('winston');
var container = new Winston.Container();

function delay(next) {
    return function() {
        var args = arguments;
        setTimeout(function() {
            next.apply(null, args);
        }, 50);
    };
}

function getLogger(type, label) {
    container.add(type, {
        console: {
            handleExceptions: type == 'exception',
            timestamp: true,
            label: label + " - " +  process.pid,
            colorize: true
        },
    });
    return container.get(type);
}

//getLogger("exception", "EXCEPTION").exitOnError = false;
var _response = getLogger("response", "RESPONSE");
var _request  = getLogger('request', "REQUEST");

var response = delay(function(conn) {
    _response.info("response", {
        reqid: conn.reqid,
        response_time:  new Date - conn.started,
        status:  conn.statusCode,
        worker: (conn.worker||{}).address,
    });
});

var request = delay(function(conn) {
    _request.info("request", {
        reqid: conn.reqid,
        date:  conn.started,
        method: conn.method,
        hostname: conn.host,
        path: conn.url,
        ip:   conn.ip,
    });
});


function Logging(Proxy) {
    Proxy.on('request', request);
    Proxy.on('response', response);
}

exports.plugin = Logging;
