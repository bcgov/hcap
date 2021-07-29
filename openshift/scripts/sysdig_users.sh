#!/bin/bash 

set -e
set -a

export OS_NAMESPACE_PREFIX=f047a2
REPO_LOCATION=$(git rev-parse --show-toplevel)
SYSDIG_USERS=$REPO_LOCATION/sysdig_users

NS=$(oc project | cut -d ' ' -f 3 | tr -d '"')

if [ $NS != "${OS_NAMESPACE_PREFIX}-tools" ]; then
    echo "Current Namespace: $NS, Switch to tools name space"
    exit 0
fi

if test -f "$SYSDIG_USERS"; then
    source $SYSDIG_USERS
    envsubst < $REPO_LOCATION/openshift/sysdig.yml | oc apply -n ${OS_NAMESPACE_PREFIX}-tools -f - 
else 
    echo "$SYSDIG_USERS does not exist. Create the user config file first"
fi
