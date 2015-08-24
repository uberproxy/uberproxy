#!/bin/bash

set -e

# Generate defaults
export UBERPROXY_CONFIG=${UBERPROXY_CONFIG:-"/config/config.yml"}

echo "\nEnvironment variables:"
echo "- Config path:           ${UBERPROXY_CONFIG}"
echo "- Dynamic config path:   ${UBERPROXY_DYNAMIC}"
echo "- SSL certificates path: ${UBERPROXY_SSL_CERTS}"
echo "- Secret:                ${UBERPROXY_SECRET}"
echo "- Clusters:              ${UBERPROXY_CLUSTER}"
echo "Please check your environment variables if you find something is misconfigured."

echo "\nRunning Uberproxy..."
/usr/bin/nodejs index.js server -c ${UBERPROXY_CONFIG}