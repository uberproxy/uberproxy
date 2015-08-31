FROM ubuntu:14.04
MAINTAINER Igor Mukhin <igor.mukhin@gmail.com>

# Setup binaries
RUN sudo apt-get update && \
    sudo apt-get -y upgrade && \
    sudo apt-get install -y npm nodejs && \
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
