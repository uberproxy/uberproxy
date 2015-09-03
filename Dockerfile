FROM ubuntu:14.04
MAINTAINER Igor Mukhin <igor.mukhin@gmail.com>

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update
RUN apt-get -y upgrade

# Useful
RUN apt-get install -y curl
RUN locale-gen en_GB en_GB.UTF-8

# Use latest nodejs & npm
RUN curl -sL https://deb.nodesource.com/setup_0.12 | sudo -E bash -
# RUN apt-get update # We don't need do it again - update called inside script from previous line
RUN apt-get install -y nodejs && \
	apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install app & dependencies
VOLUME /app
WORKDIR /app
COPY . /app
RUN mkdir -p /dist/node_modules && \
	cp /app/package.json /dist/package.json && \
	cd /dist/ && \
	npm cache clean && \
	npm install

ENV NODE_PATH /dist/node_modules

# Configure
VOLUME /config
COPY ./examples/config/* /config/

# Dockerize
COPY ./dockerize.sh /dockerize.sh
RUN chmod +x /*.sh

EXPOSE  80
EXPOSE  443

CMD /dockerize.sh
