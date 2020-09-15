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

local-build:
	@echo "Building local app image"
	@docker-compose -f docker-compose.dev.yml build

local-run:
	@echo "Running local app container"
	@docker-compose -f docker-compose.dev.yml up

local-run-db:
	@echo "Running local DB container"
	@docker-compose -f docker-compose.dev.yml up mongodb

local-close:
	@echo "Stopping local app container"
	@docker-compose -f docker-compose.dev.yml down

local-db-seed:
	@echo "Seeding local DB container"
	@docker exec -it $(APP_NAME)-server npm run db:seed

local-server-tests:
	@echo "Running tests in local app container"
	@docker exec -it $(APP_NAME)-server npm test

# OpenShift Aliases

os-permissions:
	@oc project $(OS_NAMESPACE)
	@oc create sa github-$(OS_NAMESPACE_SUFFIX)
	@oc policy add-role-to-user system:image-builder -z github-$(OS_NAMESPACE_SUFFIX)
	@oc create secret generic $(APP_NAME)-github-key --from-file=ssh-privatekey=key --type=kubernetes.io/ssh-auth
	@oc secrets link builder $(APP_NAME)-github-key

server-create:
	@oc project $(OS_NAMESPACE)
	@oc process -f openshift/server.bc.yml -p NAMESPACE=$(OS_NAMESPACE) APP_NAME=$(APP_NAME) | oc apply -f -
	@oc process -f openshift/server.dc.yml -p NAMESPACE=$(OS_NAMESPACE) APP_NAME=$(APP_NAME) | oc apply -f -

server-build:
	@oc cancel-build bc/$(APP_NAME)-server -n $(OS_NAMESPACE)
	@oc start-build $(APP_NAME)-server -n $(OS_NAMESPACE)

db-create:
	@oc project $(OS_NAMESPACE)
	@oc process -f openshift/mongo.yml -p APP_NAME=$(APP_NAME) | oc apply -f -

db-tunnel:
	@oc project $(OS_NAMESPACE)
	@oc port-forward $(APP_NAME)-mongodb-0 27017
