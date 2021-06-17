#!make
-include .env

export $(shell sed 's/=.*//' .env)
.DEFAULT_GOAL:=print-status
export APP_NAME:=hcap
export OS_NAMESPACE_PREFIX:=f047a2
export OS_NAMESPACE_SUFFIX?=dev
export COMMIT_SHA:=$(shell git rev-parse --short=7 HEAD)
# Without --decorate=short --no-color make file is not happy handling the colors and skips that part of data
export LAST_COMMIT:=$(shell git log -1 --oneline --decorate=full --no-color --format="%h, %cn, %f, %D" | sed 's/->/:/')
export TARGET_NAMESPACE=$(OS_NAMESPACE_PREFIX)-$(OS_NAMESPACE_SUFFIX)
export TOOLS_NAMESPACE=$(OS_NAMESPACE_PREFIX)-tools
export DATABASE_URL=postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_PORT}/${POSTGRES_DB}
# Status Output

print-status:
	@echo "APP_NAME: $(APP_NAME)"
	@echo "TARGET_NAMESPACE: $(TARGET_NAMESPACE)"
	@echo "TOOLS_NAMESPACE: $(TOOLS_NAMESPACE)"
	@echo "COMMIT_SHA: $(COMMIT_SHA)"
	@echo "LAST_COMMIT: $(LAST_COMMIT)"

# Keycloak

kc-export-users:
	@/bin/bash .docker/keycloak/export-users.sh

kc-import-users:
	@/bin/bash .docker/keycloak/import-users.sh

# Migration (depends on DATABASE_URL)

migrate-up:
	@npm run migrate up --prefix server

migrate-down:
	@npm run migrate down --prefix server

seed-participants:
	@echo "Seeding participants from server/scripts/xlsx"
	@docker-compose -f docker-compose.dev.yml exec server npm run feed-participants $$SHEET

seed-sites:
	@echo "Seeding sites from server/scripts/xlsx"
	@docker-compose -f docker-compose.dev.yml exec server npm run feed-sites $$SHEET

# Local Development

local-build:
	@echo "Building local app image"
	@docker-compose -f docker-compose.dev.yml build

local-run: local-build
	@echo "Running local app container"
	@docker-compose -f docker-compose.dev.yml up

local-kc-build:
	@echo "Building test local app container"
	@docker-compose -f docker-compose.test.yml build

local-kc-run:
	@echo "Starting test local app container"
	@docker-compose -f docker-compose.test.yml up

local-kc-down:
	@echo "Stopping local app container"
	@docker-compose -f docker-compose.test.yml down --remove-orphans

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
	@/bin/bash .docker/keycloak/import-users.sh
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

add-role:
	@oc policy add-role-to-user admin system:serviceaccount:$(TARGET_NAMESPACE):default -n $(TOOLS_NAMESPACE)

networking-prep:
	@oc process -f openshift/networking.yml | oc apply -n $(TARGET_NAMESPACE) -f -

server-prep:
	@oc process -f openshift/ches.prep.yml -p APP_NAME=$(APP_NAME) | oc create -n $(TARGET_NAMESPACE) -f -
	@oc process -f openshift/keycloak.prep.yml -p APP_NAME=$(APP_NAME) | oc create -n $(TARGET_NAMESPACE) -f -

server-create:
	@oc process -f openshift/server.bc.yml -p APP_NAME=$(APP_NAME) | oc apply -n $(TOOLS_NAMESPACE) -f -
	@oc process -f openshift/server.dc.yml -p APP_NAME=$(APP_NAME) IMAGE_NAMESPACE=$(TOOLS_NAMESPACE) IMAGE_TAG=$(OS_NAMESPACE_SUFFIX) | oc apply -n $(TARGET_NAMESPACE) -f -

server-build:
	@oc cancel-build bc/$(APP_NAME)-server -n $(TOOLS_NAMESPACE)
	@oc start-build $(APP_NAME)-server -n $(TOOLS_NAMESPACE) --wait --follow=true --build-arg VERSION="$(LAST_COMMIT)"
	@oc tag $(APP_NAME)-server:latest $(APP_NAME)-server:$(COMMIT_SHA)

server-deploy:
	@oc tag $(APP_NAME)-server:$(COMMIT_SHA) $(APP_NAME)-server:$(OS_NAMESPACE_SUFFIX)

mongo-prep:
	@oc process -f openshift/mongo.yml -p APP_NAME=$(APP_NAME) | oc apply -n $(TARGET_NAMESPACE) -f -

build-db-backup:
	@oc -n $(TOOLS_NAMESPACE) process -f openshift/universal.bc.yml -p NAME=$(APP_NAME)-backup -p TAG="latest" -p BASE_IMAGE_NAME="postgresql-12-rhel7" -p BASE_IMAGE_TAG="latest" -p BASE_IMAGE_REPO="registry.redhat.io/rhscl/" -p SOURCE_REPOSITORY_URL="https://github.com/BCDevOps/backup-container.git" -p SOURCE_REPOSITORY_REF="master" -p SOURCE_CONTEXT_DIR="docker" | oc -n $(TOOLS_NAMESPACE) apply -f -
	@oc -n $(TOOLS_NAMESPACE) start-build bc/$(APP_NAME)-backup --wait

deploy-db-backup:
	@oc -n $(TARGET_NAMESPACE) process -f openshift/backup.dc.yml -p NAME=$(APP_NAME)-backup -p IMAGE_STREAM_TAG=$(APP_NAME)-backup:latest -p BUILD_NAMESPACE=$(TOOLS_NAMESPACE) -p DB_NAME=$(APP_NAME)  | oc -n $(TARGET_NAMESPACE) apply -f -

db-prep:
	@oc process -f openshift/patroni.prep.yml -p APP_NAME=$(APP_NAME) | oc create -n $(TARGET_NAMESPACE) -f -
	@oc policy add-role-to-user system:image-puller system:serviceaccount:$(TARGET_NAMESPACE):$(APP_NAME)-patroni -n $(TOOLS_NAMESPACE)

db-create:
	@oc process -f openshift/patroni.bc.yml -p APP_NAME=$(APP_NAME) | oc apply -n $(TOOLS_NAMESPACE) -f -
	@oc process -f openshift/patroni.dc.yml -p APP_NAME=$(APP_NAME) IMAGE_NAMESPACE=$(TOOLS_NAMESPACE) | oc apply -n $(TARGET_NAMESPACE) -f -

db-mongo-tunnel:
	@oc project $(TARGET_NAMESPACE)
	@oc port-forward service/$(APP_NAME)-mongo-headless 27017

db-postgres-tunnel:
	@oc project $(TARGET_NAMESPACE)
	@oc port-forward $(APP_NAME)-patroni-0 5432
