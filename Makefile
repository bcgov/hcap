#!make

.DEFAULT_GOAL:=print-status
export APP_NAME:=hcap
export OS_NAMESPACE_PREFIX:=rupaog
export OS_NAMESPACE_SUFFIX?=dev
export COMMIT_SHA:=$(shell git rev-parse --short=7 HEAD)
export OS_NAMESPACE=$(OS_NAMESPACE_PREFIX)-$(OS_NAMESPACE_SUFFIX)

# Status Output

print-status:
	@echo "APP_NAME: $(APP_NAME)"
	@echo "OS_NAMESPACE: $(OS_NAMESPACE)"
	@echo "COMMIT_SHA: $(COMMIT_SHA)"

# Local Development

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
	@docker exec -it $(APP_NAME)-server npm run db:seed

local-server-tests:
	@echo "Running tests in local app container"
	@docker exec -it $(APP_NAME)-server npm test

# OpenShift Aliases

server-pull-key:
	@oc project $(OS_NAMESPACE)
	@oc create secret generic hcap-gh-key --from-file=ssh-privatekey=key --type=kubernetes.io/ssh-auth
	@oc secrets link builder hcap-gh-key

server-create:
	@oc project $(OS_NAMESPACE)
	@oc process -f openshift/server.bc.yml -p NAMESPACE=$(OS_NAMESPACE) APP_NAME=$(APP_NAME) | oc apply -f -
	@oc process -f openshift/server.dc.yml -p NAMESPACE=$(OS_NAMESPACE) APP_NAME=$(APP_NAME) | oc apply -f -

server-build:
	@oc project $(OS_NAMESPACE)
	@oc cancel-build bc/$(APP_NAME)-server
	@oc start-build $(APP_NAME)-server

db-create:
	@oc project $(OS_NAMESPACE)
	@oc process -f openshift/mongo.yml -p APP_NAME=$(APP_NAME) | oc apply -f -

db-tunnel:
	@oc project $(OS_NAMESPACE)
	@oc port-forward $(APP_NAME)-mongodb-0 27017
