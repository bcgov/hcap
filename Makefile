#!make

.DEFAULT_GOAL:=print-status
export APP_NAME:=hcap
export OS_NAMESPACE_PREFIX:=rupaog
export OS_NAMESPACE_SUFFIX?=dev
export COMMIT_SHA:=$(shell git rev-parse --short=7 HEAD)
export TARGET_NAMESPACE=$(OS_NAMESPACE_PREFIX)-$(OS_NAMESPACE_SUFFIX)
export TOOLS_NAMESPACE=$(OS_NAMESPACE_PREFIX)-tools

# Status Output

print-status:
	@echo "APP_NAME: $(APP_NAME)"
	@echo "TARGET_NAMESPACE: $(TARGET_NAMESPACE)"
	@echo "TOOLS_NAMESPACE: $(TOOLS_NAMESPACE)"
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
	@docker-compose -f docker-compose.dev.yml up postgres

local-close:
	@echo "Stopping local app container"
	@docker-compose -f docker-compose.dev.yml down

local-db-seed:
	@echo "Seeding local DB container"
	@docker exec -it $(APP_NAME)-server npm run db:seed

local-server-tests:
	@echo "Running tests in local app container"
	@docker exec -it $(APP_NAME)-server npm test

# Git Tagging Aliases

tag-dev:
	@echo "Deploying $(APP_NAME):$(COMMIT_SHA) to dev env"
	@git tag -fa dev -m "Deploying $(APP_NAME):$(COMMIT_SHA) to dev env" $(COMMIT_SHA)
	@git push --force origin refs/tags/dev:refs/tags/dev

tag-test:
	@echo "Deploying $(APP_NAME):$(COMMIT_SHA) to test env"
	@git tag -fa test -m "Deploying $(APP_NAME):$(COMMIT_SHA) to test env" $(COMMIT_SHA)
	@git push --force origin refs/tags/test:refs/tags/test

tag-prod:
	@echo "Deploying $(APP_NAME):$(COMMIT_SHA) to prod env"
	@git tag -fa prod -m "Deploying $(APP_NAME):$(COMMIT_SHA) to prod env" $(COMMIT_SHA)
	@git push --force origin refs/tags/prod:refs/tags/prod

# OpenShift Aliases

server-prep: # This should be a template similar to DB prep
	@oc policy add-role-to-user system:image-puller system:serviceaccount:$(TARGET_NAMESPACE):default -n $(TOOLS_NAMESPACE)

server-create:
	@oc process -f openshift/server.bc.yml -p APP_NAME=$(APP_NAME) | oc apply -n $(TOOLS_NAMESPACE) -f -
	@oc process -f openshift/server.dc.yml -p APP_NAME=$(APP_NAME) IMAGE_NAMESPACE=$(TOOLS_NAMESPACE) IMAGE_TAG=$(OS_NAMESPACE_SUFFIX) | oc apply -n $(TARGET_NAMESPACE) -f -

server-build:
	@oc cancel-build bc/$(APP_NAME)-server -n $(TOOLS_NAMESPACE)
	@oc start-build $(APP_NAME)-server -n $(TOOLS_NAMESPACE) --wait
	@oc tag $(APP_NAME)-server:latest $(APP_NAME)-server:$(COMMIT_SHA)

server-deploy:
	@oc tag $(APP_NAME)-server:$(COMMIT_SHA) $(APP_NAME)-server:$(OS_NAMESPACE_SUFFIX)

db-prep:
	@oc process -f openshift/patroni.prep.yml -p APP_NAME=$(APP_NAME) | oc create -n $(TARGET_NAMESPACE) -f -
	@oc policy add-role-to-user system:image-puller system:serviceaccount:$(TARGET_NAMESPACE):$(APP_NAME)-patroni -n $(TOOLS_NAMESPACE)

db-create:
	@oc process -f openshift/patroni.bc.yml -p APP_NAME=$(APP_NAME) | oc apply -n $(TOOLS_NAMESPACE) -f -
	@oc process -f openshift/patroni.dc.yml -p APP_NAME=$(APP_NAME) IMAGE_NAMESPACE=$(TOOLS_NAMESPACE) | oc apply -n $(TARGET_NAMESPACE) -f -

db-mongo-tunnel:
	@oc project $(TARGET_NAMESPACE)
	@oc port-forward $(APP_NAME)-mongodb-0 27017

db-postgres-tunnel:
	@oc project
	@oc port-forward $(APP_NAME)-patroni-0 5432
	
