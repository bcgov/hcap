#!/bin/bash

echo -n "Environment (d/t): "
read CF

if [[ $CF = "d" ]]
then
    k6 run -e HOST=https://hcapparticipants.dev.freshworks.club --summary-export k6-$(date "+%Y%m%d-%H%M%S").json script.js
fi


if [[ $CF = "t" ]]
then
    k6 run -e HOST=https://hcapparticipants.test.freshworks.club --summary-export k6-$(date "+%Y%m%d-%H%M%S").json script.js
fi

