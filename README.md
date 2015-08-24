UberProxy
========

In the cloud era we need smart proxies.

## Features

1. Highly configurable
    - Provides a [RESTful interface](docs/protocol.md) to add and remove workers, SSL domains, etc.
2. Easy to extend.
    - [Write plugins](docs/plugins.md) in Javascript!
    - Everything is a plugin internally
        - [Redirect](plugins/redirect.js)
        - [Logging](plugins/logs.js)
3. Fast (NodeJS is neat handling lots of I/O)
4. Efficient uploads
    - The proxy buffer to disk a file upload
    - When it's ready it forwards to the worker
    - The Proxy deal much better with slow connections
5. Throttle connections to workers (by default 20 per worker)
6. SSL support
7. URL sanitization
    - `//foobar///` will be rewrite to `/foobar` before forwarding the app
8. The workers are in control of everything:
    - Rewrite hostname
    - Rewrite URL
    - Expose URL (with regular expressions) they can work
        - If a worker can serve `^/(foo|bar)/.+`, any other request will generate a `404 Error page` in the proxy itself.
    - They can choose which plugins to use (Global plugins may apply any ways)

### Some concepts

1. **Proxy**: It's a webserver which is in the between a client and an application
2. **Worker**: It's a webserver, where our application is hosted.


### Why a proxy?

Having a proxy makes really easy to scale up or down our applications in a matter of seconds. `UberProxy` makes it possible to add and remove more workers to your application.

## Installation
 
```bash
npm install -g uberproxy
```

## Configuration

To create a new configuration you need to run the following command

```bash
# Create a secret token
uberproxy setup
```

That will generate a `config.yml` (you can override that with `-c config.json`) that would look like this:

```yaml
ssl:
    port: 443
    certs: /var/tmp/uberproxy/https-certs
dynamic: /var/tmp/uberproxy/dynamic.yml
cluster: 4
port: 80
secret: 8e0c5e97f91e1a8dde85702ffadff48e8488fda46c457712920aa835dabe25c8
```

In order to run the server you should execute this command:

```bash
uberproxy server [-c|--config config.yml] [-w|--worker workers_count] [-p|--http-port 80] [-s|--https-port 443]
```

You can override config variables:

- `UBERPROXY_CONFIG` overrides config filename
- `UBERPROXY_DYNAMIC` overrides dynamic config filename - `dynamic` section of `config.yml`
- `UBERPROXY_SSL_CERTS` overrides ssl path - `ssl.certs` section of `config.yml`
- `UBERPROXY_SECRET` overrides secret - `secret` section of `config.yml`
- `UBERPROXY_CLUSTER` overrides workers count - `cluster` section of `config.yml`

If you run `uberproxy` with empty config it will be initialized with default values just like you prepared next config:

```
ssl:
    port: 443
    certs: /config/ssl
dynamic: /config/dynamic.yml
cluster: 4
port: 80
```

Config's secret key is mandatory and haven't default value.
So if you want to run `uberproxy` with empty config - you need to pass `secret` via environment variable:

```
UBERPROXY_SECRET=123 uberproxy -c empty.yml
```

Otherwise error will be raised.

### Parts

1. **ssl**
    * **port**: What port should the Https-Proxy listen to?
    * **certs**: What directory should be used to store the certs files?
2. **dynamic**: A file (`YAML` or `JSON`) where the dynamic configurations are stored.
3. **cluster**: How many workers should it use? Ideally it should the same number of CPUs available on the erver
4. **port**: What port should the Http-proxy listen to?
5. **secret**: A secret token used for the dynamic configuration


## Running

    node index.js

You may need it to run as `sudo`, by default it tries to open 80 and 443 (port which usually requires super user permissions).

Then open `http://127.0.0.1/`. You would see a `Not Found` page, that is because the proxy doesn't have any worker configured yet. 

## Adding workers

To add a plugin you can see the [PHP Client](https://github.com/uberproxy/php-sdk), just make sure the secrets are the same.

It's also possible to define a worker on the config file. If you're using `YAML` it would look like this:

```yaml
workers:
    -
        worker: 'localhost:3333'
        hostname:
            - domain2.foobar.net
        maxreq: 20
```

That's it, all requests for `domain2.foobar.net` will be forwarded to `localhost:3333`.

## TODO

1. More documentation
    - Config to register apps
    - Protocol 
2. More examples on plugins
    - Cache plugins
    - ZLib
3. Code style
    - Add .editorconfig
    - Add .jscsrc
