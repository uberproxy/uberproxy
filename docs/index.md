# UberProxy

UberProxy is a **reverse proxy** written in NodeJS. It was designed to be fast and easy to configure.

## Features

1. Highly configurable
    - Provides a [RESTful interface](usage/#restful-interface) to add and remove workers, SSL domains, etc.
2. Easy to extend.
    - [Write plugins](plugins) in Javascript!
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

