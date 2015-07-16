# Plugins

## Schema

```js
function Plugin(Proxy) {
    Proxy.on('request', function(conn) {
        conn.headers['X-Added-From-Plugin'] = 1;
    });
}

exports.plugin = Plugin;
```

And we should save it as `plugins/foobar.js`. By default plugins are global (they listen on all events). But it's possible to make a plugin that works on the worker level.

```js
function Plugin(Proxy) {
    if (Worker.constructor.name !== 'Worker') {
        return;
    }
    Proxy.on('request', function(conn) {
        conn.headers['X-Added-From-Plugin'] = 1;
    });
}

exports.plugin = Plugin;
```

By doing so, the worker would need to say explicity they want to use the `foobar` plugin.

## Events 

1. `preforward(Connection)`: A request is about to be forwarded to a worker.
2. `forward.response(Connection)`: Data is ready to send to the client, there a `Connection.worker` to get information from the worker who handled the request
3. `response(Connection)`: Data is ready to be send to the client, it's not safe to rely on `Connection.worker` as it may not exists

