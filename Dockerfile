FROM ubuntu:14.04
MAINTAINER Igor Mukhin <igor.mukhin@gmail.com>

# Setup binaries
RUN apt-get update && \
    apt-get -y upgrade && \
    apt-get install -y curl && \
	curl -sL https://deb.nodesource.com/setup_0.12 | sudo bash - && \
	apt-get update && \
	apt-get install -y nodejs && \
	apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install app & dependencies
VOLUME /app
WORKDIR /app
COPY . /app
RUN npm cache clean && npm install

# Configure
VOLUME /config
COPY ./examples/config/* /config/

# Dockerize
COPY ./dockerize.sh /dockerize.sh
RUN chmod +x /*.sh

EXPOSE  80
EXPOSE  443

CMD /dockerize.sh
