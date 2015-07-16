function RewriteHeader(proxy) {
    proxy.on('request', function(conn) {
        var parts = /foo(.+)/.exec(conn.url);
        if (conn.host.match(/foobar.net$/) && parts) {
            conn.headers['X-From-Plugin'] = parts[1];
        }
    });
}

exports.plugin = RewriteHeader;
