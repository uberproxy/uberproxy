#!/bin/bash

set -e

# Generate defaults
export UBERPROXY_CONFIG=${UBERPROXY_CONFIG:-"/config/config.yml"}
# export UBERPROXY_SECRET=${UBERPROXY_SECRET:-$(/usr/bin/pwgen -s 12 1)}

echo "\nEnvironment variables:"
echo "- Config path:           ${UBERPROXY_CONFIG}"
echo "- Dynamic config path:   ${UBERPROXY_DYNAMIC}"
echo "- SSL certificates path: ${UBERPROXY_SSL_CERTS}"
echo "- Secret:                ${UBERPROXY_SECRET}"
echo "- Clusters:              ${UBERPROXY_CLUSTER}"
echo "Please check your environment variables if you find something is misconfigured."

echo "\nInitial config '${UBERPROXY_CONFIG}' content:"
cat "${UBERPROXY_CONFIG}"

echo "\nCopying '$UBERPROXY_CONFIG' to '/config/config.current.yml'"
cp "${UBERPROXY_CONFIG}" /config/config.current.yml

if [ ! -z "${UBERPROXY_SSL_CERTS}" ]; then
	UBERPROXY_SSL_CERTS_QUOTED=$(echo "$UBERPROXY_SSL_CERTS" | sed -e 's/\//\\\//g')

	echo "Apply UBERPROXY_SSL_CERTS='$UBERPROXY_SSL_CERTS' into config '/config/config.current.yml'\n"

	sed -i \
		-e "s/certs:.*$/certs: $UBERPROXY_SSL_CERTS_QUOTED/g" \
		/config/config.current.yml
fi

if [ ! -z "${UBERPROXY_DYNAMIC}" ]; then
	UBERPROXY_DYNAMIC_QUOTED=$(echo "$UBERPROXY_DYNAMIC" | sed -e 's/\//\\\//g')

	echo "Apply UBERPROXY_DYNAMIC='$UBERPROXY_DYNAMIC' into config '/config/config.current.yml'\n"

	sed -i \
		-e "s/dynamic:.*$/dynamic: $UBERPROXY_DYNAMIC_QUOTED/g" \
		/config/config.current.yml
fi

if [ ! -z "${UBERPROXY_SECRET}" ]; then
	echo "Apply UBERPROXY_SECRET='$UBERPROXY_SECRET' into config '/config/config.current.yml'\n"

	sed -i \
		-e "s/secret:.*$/secret: $UBERPROXY_SECRET/g" \
		/config/config.current.yml
fi

if [ ! -z "${UBERPROXY_CLUSTER}" ]; then
	echo "Apply UBERPROXY_CLUSTER='$UBERPROXY_CLUSTER' into config '/config/config.current.yml'\n"

	sed -i \
		-e "s/secret:.*$/secret: $UBERPROXY_CLUSTER/g" \
		/config/config.current.yml
fi

echo "\nConfig '/config/config.current.yml' now becomes:"
cat "/config/config.current.yml"

echo "\nRunning Uberproxy..."
/usr/bin/nodejs index.js server -c /config/config.current.yml