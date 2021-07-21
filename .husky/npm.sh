#!/bin/bash

npm_version=$(npm -v)

IFS='.'
npm_version=($npm_version)
unset IFS

npm_major=${npm_version[0]}

if [ $npm_major -lt 7 ]; then
    echo "NPM Version is below 7 please fix it!"
    exit 1
fi
