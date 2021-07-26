#!/bin/bash

# Bash sets the BASH environment variable, so if it is not set, then we
# are running in a different shell, so manually run ourselves in BASH.
if [ -z "${BASH:-}" ]; then
  exec bash "$0" "$@"
fi

npm_version=$(npm -v)

IFS='.'
npm_version=($npm_version)
unset IFS

npm_major=${npm_version[0]}

if [ $npm_major -lt 7 ]; then
    echo "NPM Version is below 7 please fix it!"
    exit 1
fi
