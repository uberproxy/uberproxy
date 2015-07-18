'use strict';

var UUID  = require('node-uuid');
var URL   = require('url');
var Fs    = require('fs');
var Http  = require('http');
var Proxy = require('./proxy');

function Connection(req, res, proxy) 
{
    this.headers = req.headers;
    this.slotid  = 0xffff;
    this.reqid   = UUID.v4();
    this.started = new Date;
    this.host    = req.headers.host;
    this.method  = req.method;
    this.ip      = req.connection.remoteAddress;
    this.req     = req;
    this.res     = res;
    this.done    = false;
    this.sanitizeUrl();

    Proxy.emit('request', this);
};

Connection.prototype._end_request = function() {
    ++this.worker._maxreq;
    Proxy.requestEnd(this.worker.appId, this.reqid);
};

Connection.prototype._err_handler = function(e) {
    this.statusCode = 500;
    this.headers    = {};
    this._emit_response();
    this.res.end(Proxy.htmls['error'] || "Error");
    this._end_request();
    if (++this.worker.errors >= 10) {
        // so long and thanks for all the fish!
        Proxy.deregister(this.worker);
    }
};

Connection.prototype._req_handler = function(_res) {
    _res.on('end', this._end_request.bind(this));
    this.statusCode = _res.statusCode;
    this.headers    = _res.headers;
    this._emit_response();
    _res.pipe(this.res);
};

Connection.prototype.getHttpClient = function() {
    this.headers['X-Forwarded-For'] = this.ip;
    this.headers['X-Request-Id']    = this.reqid;
    this.headers['host']            = this.worker._rewrite.host || this.host;
    this.headers['X-Host']          = this.host;
    this.headers['X-Slot-Id']       = this.slotid
    var request = {
        hostname: this.worker._client,
        port: this.worker._port,
        method: this.method,
        path: this.worker.rewriteUrl(this.url),
        headers: this.headers,
    };

    return Http.request(request, this._req_handler.bind(this))
        .on('error', this._err_handler.bind(this));
};

/**
 *  Buffer request
 *
 *  This function buffers a file upload larger than 100KB to disk rather than
 *  forward the request directly to the worker. By doing so, the proxy (which is I/O friendly)
 *  will be saving the upload in a disk file (which takes time 1s, an hour, we don't know) and 
 *  forwards the upload to the worker *just* when it's ready (we assume the worker and the proxy
 *  are in a super-fast network).
 */
Connection.prototype.buffer = function() {
    var tmpfile = Proxy.temp + "/" + Math.random();
    var fs = Fs.createWriteStream(tmpfile);
    this.req.pipe(fs);
    this.req.on('end', function() {
        var file   = Fs.createReadStream(tmpfile);
        var client = this.getHttpClient();
        file.pipe(client);
        file.on('end', function() {
            Fs.unlink(tmpfile, function() {});
        });
    }.bind(this));

}

Connection.prototype.forwardTo = function(worker) {
    this.worker = worker;
    if (parseInt(this.headers['content-length'] || 0) > 1024*100) {
        return this.buffer();
    }
    this.req.pipe(this.getHttpClient());
};

Connection.prototype.sanitizeUrl = function() {
    var url = URL.parse(this.req.url);
    this.pathname  = url.pathname.replace(/\/+/g, '/').replace(/\/$/, '');
    this.url       = this.pathname + (url.search||"");
    this.req.url   = this.url
};

Connection.prototype._emit_response = function() {
    this.done = true;
    if (this.worker) {
        Proxy.emit('forward.response', this);
        this.worker.emit('forward.response', this);
        this.worker.emit('response', this);
    }
    Proxy.emit('response', this);
    this.res.writeHeader(this.statusCode, this.headers);
    return this.res;
};

Connection.prototype.response = function(code, headers) {
    this.headers = headers || {};
    this.statusCode = code || 200;
    this._emit_response();
    return this.res;
};

Connection.prototype.json = function(obj, code) {
    this.statusCode = code || 200;
    this.headers    = {};
    this._emit_response();
    this.res.end(JSON.stringify(obj));
};

module.exports = Connection;
