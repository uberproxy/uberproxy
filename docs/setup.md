# Setup

## Installation

UberProxy can be installed easily with npm. 

```bash
npm install -g uberproxy
```

If you wish to have the latest code you can install it from github as well:

```bash
git clone https://github.com/uberproxy/uberproxy.git
cd uberproxy
npm install
ln -s `pwd`/index.js /usr/local/bin/uberproxy 
```

## Configuration

UberProxy needs a **configuration file**. To make things simple `uberproxy setup` will create a configuration file in the current directory.

```bash
uberproxy setup
# or
ubeproxy setup -c configuration.json
```
