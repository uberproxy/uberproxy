# Usage

## Run

```bash
uberproxy server
```

It will run a bare proxy, most requests will return a `Not Found` error. We must add workers for it to work.

## RESTful interface

The protocol is pretty simple, it can be implemented in any language which has a `http` client library.

```
POST /_uberproxy/register HTTP/1.1
Host: foobar.com
X-Auth: sha256($secret + "\0" + "register" +  "\0" + "{json_data}")

{json_data}
```

The `X-Auth` is a `sha256` hash which ensures the URI and `json_data` are legit. The `$secret` value is defined in the configuration file (usually `config.yml`).

### PHP Client
Our [PHP](https://github.com/uberproxy/php-sdk) client implements the restful interface and provides a set of really simple classes to configure UberProxy on demand. Think of it as a `Makefile` for deploying your application, once your application is ready, you execute a PHP file which describes your application to the proxy.

#### Installation

```bash
composer require uberproxy/php-client
```

#### Usage

```php
$client = new UberProxy\Client("my.proxy.com", $secret);

$client->register()
    ->worker($my_ip_address)
    ->addHost('myrealappdomain.com')
    ->enablePlugin('redirect')
    ->extra([
        'redirectTo' => ['http://www.myrealappdomain.com', 301],
    ])->send();

$client->register()
    ->worker($my_ip_address)
    ->addHost('www.myrealappdomain.com')
    ->addRoute("/")
    ->addRoute("/about")
    ->addRegexRoute('/(foo|bar)/.+')
    ->rewriteRoute("/(foo|bar)/(.+)", "index.php?action=$1&extra=$2")
    ->send();
```

The first register is listening for requests for `myrealappdomain.com` and enables the plugin `redirect`. In the extra section it gives the data the plugin needs (in this case, redirect to `www.myrealappdomain.com` with a 301 code).

The second register is registering an application for `www.myrealappdomain.com` with the following descriptions:

 1. Forward only routes `/`, `/about` and `/(foo|bar)/.+`. Any other request would return a `404` error page in the proxy itself.
 2. Rewrite `/foo/something/extra?q=1` to `index.php?q=1&action=foo&extra=something/extra`




