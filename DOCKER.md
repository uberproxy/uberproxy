
## Prerequisites for Macos

You can mount volumes only from `$HOME` directory. If you want to connect `/config` folder as volume, command can be like this:

```
docker run \
	-v $HOME/uberproxy/examples/config:/config \
	-d uberproxy/uberproxy
```

## Clone

```
cd $HOME
git clone https://github.com/uberproxy/uberproxy.git
cd uberproxy
```

## Build

```
docker build -t uberproxy/uberproxy .
```

Now you can run `docker images` and see that image compiled successfully:

```
REPOSITORY             TAG                 IMAGE ID            CREATED             VIRTUAL SIZE
uberproxy/uberproxy   latest              8f0051e1440c        2 seconds ago       359.1 MB
```

## Check

Run image by typing next command. 
Here we listed all possible ENV variables that recognized by uberproxy through Docker.

```
docker run \
	-p 80:80 \
	-p 443:443 \
	-e UBERPROXY_CONFIG=/config/config.yml \
	-e UBERPROXY_DYNAMIC=/config/dynamic.yml \
	-e UBERPROXY_SSL_CERTS=/config/ssl \
	-e UBERPROXY_SECRET=1234567890 \
	-e UBERPROXY_CLUSTER=8 \
	-v $HOME/uberproxy/examples/app:/app \
	-v $HOME/uberproxy/examples/config:/config \
	-d uberproxy/uberproxy
```

If you want to test configured image, type for example next:

```
docker run \
	-p 80:80 \
	-p 443:443 \
	-e UBERPROXY_DYNAMIC=/config/dynamic-anonymouse.yml \
	-e UBERPROXY_SECRET=1234567890 \
	-d uberproxy/uberproxy
```

Then run `docker-machine ip NAME` and type given IP as your PROXY in System Preferences to test.
You must see `404 Not Found` on all sites except `anonymouse.org`.

## Publish

After you check all workd properly - you can push your changes to repository:

```
docker login
docker push uberproxy/uberproxy
```