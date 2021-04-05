#!make
-include .env

export $(shell sed 's/=.*//' .env)
.DEFAULT_GOAL:=print-status
export APP_NAME:=hcap
export OS_NAMESPACE_PREFIX:=rupaog
export OS_NAMESPACE_SUFFIX?=dev
export COMMIT_SHA:=$(shell git rev-parse --short=7 HEAD)
export TARGET_NAMESPACE=$(OS_NAMESPACE_PREFIX)-$(OS_NAMESPACE_SUFFIX)
export TOOLS_NAMESPACE=$(OS_NAMESPACE_PREFIX)-tools
export DATABASE_URL=postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_PORT}/${POSTGRES_DB}

# Status Output

print-status:
	@echo "APP_NAME: $(APP_NAME)"
	@echo "TARGET_NAMESPACE: $(TARGET_NAMESPACE)"
	@echo "TOOLS_NAMESPACE: $(TOOLS_NAMESPACE)"
	@echo "COMMIT_SHA: $(COMMIT_SHA)"

# Keycloak

kc-export-users:
	@sh .docker/keycloak/export-users.sh

kc-import-users:
	@sh .docker/keycloak/import-users.sh

# Migration (depends on DATABASE_URL)

migrate-up:
	@npm run migrate up --prefix server

migrate-down:
	@npm run migrate down --prefix server

# Local Development

local-build:
	@echo "Building local app image"
	@docker-compose -f docker-compose.dev.yml build

local-run:
	@echo "Running local app container"
	@docker-compose -f docker-compose.dev.yml up

local-kc-build:
	@echo "Building test local app container"
	@docker-compose -f docker-compose.test.yml build

local-kc-run:
	@echo "Starting test local app container"
	@docker-compose -f docker-compose.test.yml up -d

local-kc-down:
	@echo "Stopping local app container"
	@docker-compose -f docker-compose.test.yml down

local-run-db:
	@echo "Running local DB container"
	@docker-compose -f docker-compose.dev.yml up postgres

local-close:
	@echo "Stopping local app container"
	@docker-compose -f docker-compose.dev.yml down

local-clean:
	@echo "Cleaning local app"
	@docker-compose -f docker-compose.dev.yml down -v

local-server-tests:
	@sh .docker/keycloak/import-users.sh	
	@echo "Running tests in local app container"
	@docker exec $(APP_NAME)-server npm test

local-cypress-tests:
	@echo "Running all available Cypress tests"
	@npx cypress run --headless

database: ## <Helper> :: Executes into database container.
	@echo "Make: Shelling into local database container ..."
	@export PGPASSWORD=$(POSTGRES_PASSWORD)
	@docker-compose -f docker-compose.dev.yml exec postgres psql -U $(POSTGRES_USER) $(POSTGRES_DB)

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

server-prep: # TODO: Move role binding command to a server prep template
	@oc process -f openshift/keycloak.prep.yml -p APP_NAME=$(APP_NAME) | oc create -n $(TARGET_NAMESPACE) -f -
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
	@oc project $(TARGET_NAMESPACE)
	@oc port-forward $(APP_NAME)-patroni-0 5432
