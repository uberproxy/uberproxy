'use strict';

/**
 * This plugin injects the X-Request-ID header
 *
 * Based on https://devcenter.heroku.com/articles/http-request-id
 */
function RequestIdHeader(proxy) {
    /**
     *  A response is about to be send to an user,
     *  it's our change to add some headers :-)
     */
    proxy.on('response', function(conn) {
        conn.headers['X-Request-ID']   = conn.reqid;
        conn.headers['X-Slot-Id']      = conn.slotid || 0xff;
        conn.headers['X-Request-Time'] = (new Date - conn.started) + 'ms';
    });
}

exports.plugin = RequestIdHeader;
