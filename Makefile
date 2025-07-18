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

export BUILD_REF?=dev
# Aliases 
prod-test: prod-checkout-internal

# Status Output

print-status:
	@echo "APP_NAME: $(APP_NAME)"
	@echo "TARGET_NAMESPACE: $(TARGET_NAMESPACE)"
	@echo "TOOLS_NAMESPACE: $(TOOLS_NAMESPACE)"
	@echo "COMMIT_SHA: $(COMMIT_SHA)"
	@echo "LAST_COMMIT: $(LAST_COMMIT)"
	@echo "BUILD_REF: $(BUILD_REF)"

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

migrate-up-last:
	@npm run migrate up 1 --prefix server

migrate-down-last:
	@npm run migrate down 1 --prefix server

migrate-redo:
	@npm run migrate redo --prefix server

seed-participants:
	@echo "Seeding participants from server/test-data"
	@docker-compose -f docker-compose.dev.yml exec server npm run feed-participants $$SHEET

seed-sites:
	@echo "Seeding sites from server/test-data"
	@docker-compose -f docker-compose.dev.yml exec server npm run feed-sites $$SHEET

seed-data:
	@echo "Seeding additional data from server/test-data"
	@docker-compose -f docker-compose.dev.yml exec server npm run feed-data

archive-withdrawn-participants:
	@echo "Archiving engaged withdrawn participants"
	@docker exec $(APP_NAME)-server npm run archive-withdrawn-participants

# Local Development

local-build:
	@echo "Building local app image"
	@docker-compose -f docker-compose.dev.yml build

local-run: local-build
	@echo "Running local app container"
	npm run update-apps
	@docker-compose -f docker-compose.dev.yml up

local-kc-build:
	@echo "Building test local app container"
	@docker-compose -f docker-compose.test.yml build

local-kc-run: local-kc-build
	@echo "Starting test local app container"
	@DOCKER_DEFAULT_PLATFORM=linux/amd64 docker-compose -f docker-compose.test.yml up -d

local-kc-run-only:
	@echo "Starting test local app container"
	@DOCKER_DEFAULT_PLATFORM=linux/amd64 docker-compose -f docker-compose.test.yml up -d

local-kc-run-debug: local-kc-build
	@echo "Starting test local app container in debug mode"
	@DOCKER_DEFAULT_PLATFORM=linux/amd64 docker-compose -f docker-compose.debug.yml up

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
	@docker-compose -f docker-compose.dev.yml down -v --remove-orphans

local-kc-clean:
	@echo "Cleaning local app"
	@docker-compose -f docker-compose.test.yml down -v --remove-orphans

local-server-tests:
	@/bin/bash .docker/keycloak/import-users.sh
	@echo "Running tests in local app container"
	@docker exec $(APP_NAME)-server npm test

local-cypress-tests:
	@echo "Running all available Cypress tests"
	@npx cypress run --headless

clear-data:
	@docker-compose -f docker-compose.test.yml exec server npm run clear-data

local-testing-setup:
	@docker stop ${APP_NAME}-server
	@NODE_ENV="test" docker-compose -f docker-compose.test.yml up -d
	@docker-compose -f docker-compose.test.yml exec server npm run clear-data
	@docker-compose -f docker-compose.test.yml exec server npm run feed-data

local-testing-teardown:
	@docker stop ${APP_NAME}-server

database: ## <Helper> :: Executes into database container.
	@echo "Make: Shelling into local database container ..."
	@export PGPASSWORD=$(POSTGRES_PASSWORD)
	@docker-compose -f docker-compose.dev.yml exec postgres psql -U $(POSTGRES_USER) $(POSTGRES_DB)

app: ## Bash into App container
	@echo "Make: Shelling into local application container"
	@docker-compose -f docker-compose.dev.yml exec server /bin/bash

run-local-db: local-build
	@docker-compose -f docker-compose.dev.yml up postgres

# Local Development for Apple Silicon computers

local-kc-arm-build:
	@echo "Building test local app container"
	@docker-compose -f docker-compose.arm.test.yml build

local-kc-arm-run:
	@echo "Starting test local app container"
	@docker-compose -f docker-compose.arm.test.yml up -d

local-kc-arm-down:
	@echo "Stopping local app container"
	@docker-compose -f docker-compose.arm.test.yml down --remove-orphans

# Local Scripts
local-export-business-bceid-has:
	@npx ts-node ./server/scripts/export-user-ha.ts

local-export-all-users-has:
	@npx ts-node ./server/scripts/export-user-ha.ts --all

# Branch-based deployment commands
deploy-to-dev: #deploy the code on current branch to DEV env via dev-env branch
ifdef ticket
	@echo "Deploying current branch to DEV with ticket $(ticket)"
	@CURRENT_BRANCH=$(shell git rev-parse --abbrev-ref HEAD) && \
	git push origin $$CURRENT_BRANCH:dev-env -f
else
	@echo -e '\nTicket name missing - Example :: make deploy-to-dev ticket=BCMOHAM-12345 \n'
endif

tag-prod:
ifdef ticket
	@git tag -fa prod -m "Deploy $(ticket) to PROD env"
else
	@echo -e '\nTicket name missing - Example :: make tag-test ticket=HCAP-ABC \n'
	@echo -e 'Falling Back to using branch name\n'
	@git tag -fa prod -m "Deploy $(git rev-parse --abbrev-ref HEAD) to PROD env"
endif
	@git push --force origin refs/tags/prod:refs/tags/prod

tag-config:
	@echo "Updating config to $(APP_NAME):$(COMMIT_SHA) to all env"
	@git tag -fa config -m "Updating config $(APP_NAME):$(COMMIT_SHA) to all env" $(COMMIT_SHA)
	@git push --force origin refs/tags/config:refs/tags/config

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

server-config-test:
	@oc -n $(TARGET_NAMESPACE)  process -f openshift/server.dc.yml -p APP_NAME=$(APP_NAME) IMAGE_NAMESPACE=$(TOOLS_NAMESPACE) IMAGE_TAG=$(OS_NAMESPACE_SUFFIX) CONFIG_VERSION=$(COMMIT_SHA)  | oc apply -n $(TARGET_NAMESPACE) -f - --dry-run=true

server-config:
	@oc -n $(TARGET_NAMESPACE) process -f openshift/server.dc.yml -p APP_NAME=$(APP_NAME) IMAGE_NAMESPACE=$(TOOLS_NAMESPACE) IMAGE_TAG=$(OS_NAMESPACE_SUFFIX) CONFIG_VERSION=$(COMMIT_SHA) | oc apply -n $(TARGET_NAMESPACE) -f -

server-build-config-test:
	@echo "Testing Building config in $(TOOLS_NAMESPACE) namespace"
	@oc -n $(TOOLS_NAMESPACE) process -f openshift/server.bc.yml -p REF=$(BUILD_REF) -p APP_NAME=$(APP_NAME) | oc apply -n $(TOOLS_NAMESPACE) -f -

build-config: server-build-config-test
	@echo "Processiong and applying Building config in $(TOOLS_NAMESPACE) namespace"
	@oc -n $(TOOLS_NAMESPACE) process -f openshift/server.bc.yml -p REF=$(BUILD_REF) -p APP_NAME=$(APP_NAME) | oc apply -n $(TOOLS_NAMESPACE) -f -

server-build: build-config
	@echo "Building server image in $(TOOLS_NAMESPACE) namespace"
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

build-mongo-db-backup:
	@oc -n $(TOOLS_NAMESPACE) process -f openshift/universal.bc.yml -p NAME=$(APP_NAME)-backup-mongo-log -p TAG="latest" -p BASE_IMAGE_NAME="mongodb-36-rhel7" -p BASE_IMAGE_TAG="latest" -p BASE_IMAGE_REPO="registry.redhat.io/rhscl/" -p SOURCE_REPOSITORY_URL="https://github.com/BCDevOps/backup-container.git" -p SOURCE_REPOSITORY_REF="master" -p SOURCE_CONTEXT_DIR="docker" | oc -n $(TOOLS_NAMESPACE) apply -f -
	@oc -n $(TOOLS_NAMESPACE) start-build bc/$(APP_NAME)-backup-mongo-log --wait

deploy-mongo-db-backup-test:
	@oc -n $(TARGET_NAMESPACE) process -f openshift/backup-mongo.dc.yml -p NAME=$(APP_NAME)-backup-mongo-log -p IMAGE_STREAM_TAG=$(APP_NAME)-backup-mongo-log:latest -p BUILD_NAMESPACE=$(TOOLS_NAMESPACE) -p DB_NAME=$(APP_NAME)  | oc -n $(TARGET_NAMESPACE) apply -f - --dry-run=client

deploy-mongo-db-backup:
	@oc -n $(TARGET_NAMESPACE) process -f openshift/backup-mongo.dc.yml -p NAME=$(APP_NAME)-backup-mongo-log -p IMAGE_STREAM_TAG=$(APP_NAME)-backup-mongo-log:latest -p BUILD_NAMESPACE=$(TOOLS_NAMESPACE) -p DB_NAME=$(APP_NAME)  | oc -n $(TARGET_NAMESPACE) apply -f -


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

db-postgres-rw-tunnel:
	@oc project $(TARGET_NAMESPACE)
	@oc port-forward svc/$(APP_NAME)-patroni 5432

# Create Service Pod
service-pod:
	echo "Removing existing pod"
	@oc delete pod $(APP_NAME)-service-pod --force -n $(TARGET_NAMESPACE) || true
	echo "Creating Service Pod with Service Config: '$(SERVICE_CONFIG_INPUT)' with image tag $(tag) in $(TARGET_NAMESPACE) namespace"
	@node .pipeline/service-config.js | xargs -I{} oc process -f openshift/service.pod.yml -p APP_NAME=$(APP_NAME) -p SERVICE_CONFIG={} -p IMAGE_TAG=$(tag) -p IMAGE_NAMESPACE=$(TOOLS_NAMESPACE) | oc apply -n $(TARGET_NAMESPACE) -f - --dry-run=client
	@node .pipeline/service-config.js | xargs -I{} oc process -f openshift/service.pod.yml -p APP_NAME=$(APP_NAME) -p SERVICE_CONFIG={} -p IMAGE_TAG=$(tag) -p IMAGE_NAMESPACE=$(TOOLS_NAMESPACE) | oc apply -n $(TARGET_NAMESPACE) -f -

# Cron Job
cron-job:
	@oc -n $(TARGET_NAMESPACE) process -f openshift/in-progres-stale-clean.cronjob.yml -p APP_NAME=$(APP_NAME) -p IMAGE_TAG=$(OS_NAMESPACE_SUFFIX) -p IMAGE_NAMESPACE=$(TOOLS_NAMESPACE) | oc apply -n $(TARGET_NAMESPACE) -f -
	@oc -n $(TARGET_NAMESPACE) process -f openshift/open-expired-clean.cronjob.yml -p APP_NAME=$(APP_NAME) -p IMAGE_TAG=$(OS_NAMESPACE_SUFFIX) -p IMAGE_NAMESPACE=$(TOOLS_NAMESPACE) | oc apply -n $(TARGET_NAMESPACE) -f -

# Load Testing
loadtest:
	@docker run --rm \
		-v $(PWD)/load:/load \
		-i loadimpact/k6 run \
		-e RATE=$(rate) \
		-e DURATION=$(duration) \
		-e LOAD_KC_AUTH_USERNAME=$(LOAD_KC_AUTH_USERNAME) \
		-e LOAD_KC_AUTH_PASSWORD=$(LOAD_KC_AUTH_PASSWORD) \
		-e LOAD_KC_AUTH_CLIENTID=$(LOAD_KC_AUTH_CLIENTID) \
		-e OS_NAMESPACE_SUFFIX=$(OS_NAMESPACE_SUFFIX) \
		-e KEYCLOAK_REALM=$(KEYCLOAK_REALM) \
		/load/$(script)

# Deploy Prod to test/dev
PROD_TEST_TARGET?=test
prod-checkout-internal:
ifndef key
	@echo "Please specify a deployment-key. Example: make prod-test key=HCAP-1 PROD_TEST_TARGET=test"
	@exit 1
else
	@echo "Deploying latest prod tag to '$(PROD_TEST_TARGET)' with key: $(key)\n"
	@git fetch --all --tags
	@git checkout tags/prod -b prod-$(PROD_TEST_TARGET)-$(key)
	@git tag -fa $(PROD_TEST_TARGET) -m "Deploy prod-tag ( $(git rev-parse --abbrev-ref HEAD)) to $(PROD_TEST_TARGET) env with key: $(key)"
	@git push --force origin refs/tags/$(PROD_TEST_TARGET):refs/tags/$(PROD_TEST_TARGET)
endif

