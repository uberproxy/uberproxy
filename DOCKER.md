*** I've used `igormukhin/uberproxy` name as temporary for testing purposes. 
Change to `uberproxy/uberproxy` during merge.

## Prerequisites for Macos

You need work only from `$HOME` directory if you want to connect `/config` folder as volume.

## Clone

```
cd $HOME
git checkout https://github.com/igormukhingmailcom/uberproxy.git -b feature/dockerising
cd uberproxy
```

## Build

```
docker build -t igormukhin/uberproxy .
```

Now you can run `docker images` and see that image compiled successfully:

```
REPOSITORY             TAG                 IMAGE ID            CREATED             VIRTUAL SIZE
igormukhin/uberproxy   latest              8f0051e1440c        2 seconds ago       359.1 MB
```

## Check

Run image and see logs:

```
docker logs $(docker run \
	-p 80:80 \
	-p 443:443 \
	-e UBERPROXY_CONFIG=/config/config.yml \
	-e UBERPROXY_DYNAMIC=/config/dynamic.yml \
	-e UBERPROXY_SSL_CERTS=/config/ssl \
	-e UBERPROXY_SECRET=1234567890 \
	-e UBERPROXY_CLUSTER=8 \
	-v $HOME/uberproxy/examples/config:/config \
	-d igormukhin/uberproxy \
)
```

Then run `docker-machine ip NAME` and type given IP as your PROXY in System Preferences to test.
You must see `404 Not Found` on all sites except `anonymouse.org` and `google.com`.

## Publish

After you check all workd properly - you can push your changes to repository:

```
docker login
docker push igormukhin/uberproxy
```