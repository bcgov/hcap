#!make

-include .env

export $(shell sed 's/=.*//' .env)
export COMMIT_SHA?=$(shell git rev-parse --short=7 HEAD)
export IMAGE_TAG=${COMMIT_SHA}

# Define default environment variables for local development

export PROJECT:=health-career-access-program
export ENV_PREFIX?=hcap
export ENV_SUFFIX?=dev
export VERSION_LABEL:=$(ENV_PREFIX)-$(ENV_SUFFIX)-$(IMAGE_TAG)
.DEFAULT_GOAL:=print-status

# Status Output

print-status:
	@echo "Current Settings:"
	@echo "PROJECT: $(PROJECT)"
	@echo "COMMIT_SHA: $(COMMIT_SHA)"
	@echo "IMAGE_TAG: $(IMAGE_TAG)"
	@echo "VERSION_LABEL: $(VERSION_LABEL)"

# Local Development

local:  | build-local run-local ## Task-Alias -- Run the steps for local development

build-local:
	@echo "Building local app image"
	@docker-compose -f docker-compose.dev.yml build

run-local:
	@echo "Running local app container"
	@docker-compose -f docker-compose.dev.yml up

run-local-db:
	@echo "Running local DB container"
	@docker-compose -f docker-compose.dev.yml up mongodb

close-local:
	@echo "Stopping local app container"
	@docker-compose -f docker-compose.dev.yml down

local-db-seed:
	@echo "Seeding local DB container"
	@docker exec -it $(PROJECT)-server npm run db:seed

local-server-tests:
	@echo "Running tests in local app container"
	@docker exec -it $(PROJECT)-server npm test

# OpenShift Aliases

server-pull-key:
	@oc project rupaog-dev
	@oc create secret generic hcap-gh-key --from-file=ssh-privatekey=key --type=kubernetes.io/ssh-auth
	@oc secrets link builder hcap-gh-key

server-create:
	@oc project rupaog-dev
	@oc process -f openshift/server.bc.yml --param-file=openshift/dev.env --ignore-unknown-parameters | oc apply -f -
	@oc process -f openshift/server.dc.yml --param-file=openshift/dev.env --ignore-unknown-parameters | oc apply -f -

server-build:
	@oc project rupaog-dev
	@oc cancel-build bc/hcap-server
	@oc start-build hcap-server

db-create:
	@oc project rupaog-dev
	@oc process -f openshift/mongo.yml --param-file=openshift/dev.env --ignore-unknown-parameters | oc create -n rupaog-dev -f -

db-tunnel:
	@oc project rupaog-dev
	@oc port-forward hcap-mongodb-0 27017
