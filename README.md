# Health Career Access Program

### A component of the COVID-19 response

---

## Introduction

This is a digital service built for the Ministry of Health which supports British Columbian residents to apply for the Health Career Access Program (HCAP) during the COVID-19 pandemic.

## Available Scripts

In the server directory, you can run:

### `npm run parse-xml`

Parses all xml files containing in the scripts/xml directory that follows the Orbeon format, including the file name,
and then submits to the /form endpoint. Example of file names:

- Health Career Access Program - Expression of Interest - 8353ec90e6ea8727.xml
- Health Career Access Program - Expression of Interest - 91113c10e0xx872x (1).xml

### `npm run stats`

Shows the submissions stats of a given period of days. (Before running this command, make sure that you have logged in to the OpenShift CLI and ran `make db-postgres-tunnel`)

## Migrations

In the server directory, you can run:

### `npm run migrate my-migration-script`

A `xxxx_my-migration-script.js` file in `/migrations` folder will be created. Open it and change the content with your migration strategy. [Docs](https://github.com/salsita/node-pg-migrate/blob/master/docs/migrations.md)

For example, this migration script creates a new table with the current Massive.js format:

```js
/* eslint-disable camelcase */

exports.up = pgm => {
  pgm.createTable('applicants', {
    id: 'serial',
    body: {
      type: 'jsonb',
      notNull: true,
    },
    search: {
      type: 'tsvector',
    },
    created_at: {
      type: 'timestamp with time zone',
      default: pgm.func('now()'),
    },
    updated_at: {
      type: 'timestamp with time zone',
    },
  })
};
```
After that, go to the root project folder and run `make migrate-up` to apply your migration. To undo your migration run `make migrate-down`.

On every server startup the `migrations` folder will be scanned for new migrations and then applied a `migrate up` command automatically.

## Table of Contents

1. [Project Status](#project-status)
1. [Features](#features)
1. [Getting Help or Reporting an Issue](#getting-help-or-reporting-an-issue)
1. [How to Contribute](#how-to-contribute)
1. [Development](#development)
1. [License](#license)

## Project Status

This application is in active development.

## Features

This project includes the following features:

1. Public web form for BC residents
1. Ability to download a form submission as a PDF

## Getting Help or Reporting an Issue

To report bugs/issues/feature requests, please file an [issue](https://github.com/bcgov/hcap/issues).

## How to Contribute

If you would like to contribute, please see our [contributing](CONTRIBUTING.md) guidelines.

Please note that this project is released with a [Contributor Code of Conduct](CODE-OF-CONDUCT.md). By participating in this project you agree to abide by its terms.

## Development

### Using Docker

Make sure you have Docker and Docker-compose installed in your local environment. For instructions on how to install it, follow the links below:
- https://docs.docker.com/get-docker/
- https://docs.docker.com/compose/install/

To set up and run database, backend (server), and frontend (client) applications:
- Run `make local-build` within the root folder of the project to build the application
- Run `make local-run` within the root folder of the project to run the application
- In a new tab in your terminal, run `make local-db-seed` within the root folder of the project to create the table
- You should see the application running at `localhost:4000`

To tear down your environment:
- Run `make close-local`

To seed database, run:
- `make local-db-seed`

To run server tests:
- Make sure containers are running
  - `make local`
- Shell into the server container by running
  - `make local-server-workspace`
  - `npm test`
- or by running
  - `make local-server-tests`

### Using npm

From both the client and the server folders, run `npm i` to install dependencies.

- Add a hostname alias to your environment
- - Edit your `/etc/hosts` filename
- - Add `127.0.0.1   server`


- Run client: `npm start` run within client folder
- Start Database: `make run-local-db`
- Once the DB is running, `npm run db:seed` to seed the database
- Run server: `npm run watch` from within the server folder
- Run server tests: `npm test` from within the server folder

Communication from front end to back end is facilitated by [the proxy field](https://create-react-app.dev/docs/proxying-api-requests-in-development/) in client package.json.

### Front End Views

##### /form
 - allows a user to submit their data and receive a confirmation number

##### /confirmation/:formId
 - redirect here after form submission and display confirmation number
 - button to download a PDF version of submission

### API Routes

- /form [POST] submit new form
- In production: / [GET] serves the built client app

## OpenShift Deployment

### Application

The Dockerized application is deployed to OpenShift using Makefile targets and YAML templates defined in the `openshift` directory.

To create the resources required to run the application in OpenShift, run `make server-create`. Optionally, a namespace prefix and/or suffix can be provided to target a namespace other than the default `rupaog-dev` e.g. `NAMESPACE_SUFFIX=test make server-create`.

The OpenShift objects created are defined in the [openshift/server.bc.yml](openshift/server.bc.yml) and [openshift/server.dc.yml](openshift/server.dc.yml). At a hight level, these objects include the following.
- Build Config
- Image Stream
- Service
- Route
- Deployment Config
- Secret

At a high level, the functions of each of these objects are as follows.

The *Build Config* defines how an image is built. Properties such as build strategy (Docker), repository (the very repository you're looking at), and rebuild triggers are defined within this object.

The *Image Stream* defines a stream of built images. Essentially, this is an image repository similar to DockerHub. Images sent to the Image Stream must be tagged (e.g. `latest`).

The *Service* defines a hostname for a particular service exposed by a pod or set of pods. Services can only be seen and consumed by pods within the same OpenShift namespace. The service published by the HCAP application is the backend API endpoint. Similarly, the database will expose a service that is to be consumed by the application backend.

A *Route* exposes a service to the Internet. Routes differ from services in that they may only transmit HTTP(S) traffic. As such, the database service could not be directly exposed to the Internet.

A *Deployment Config* defines how a new version of an application is to be deployed. Additionally, triggers for redeployment are defined within this object. For the HCAP application, we've used a rolling deployment triggered by new images pushed to the image stream and tagged with the `latest` tag.

Finally, a *Secret* defines values that can be used by pods within in the same namespace. While there are no secrets defined in our server application, there is a reference to a secret defined by the [MongoDB database template](openshift/mongo.yml). In order for the server to access the DB, it must be provided with `MONGODB_DATABASE` and `MONGODB_URI` environment variables. The definition for these environment variables can be found in the [server deployment config template](openshift/server.dc.yml). Note that they are referencing the `${APP_NAME}-mongodb` (resolves to `hcap-mongodb`) secret and the `mongo-url` and `database` keys within this secret.

### GitHub Actions

A service account must be created and assigned permissions to trigger a build. Run `make os-permissions` to create a service account with admin credentials. The access token for this service account (accessible via Cluster Console > Administration > Service Accounts > Secrets) can be used to login and trigger a build and thus, a new deployment. GitHub Actions has been configured to trigger a new build in a specific namespace (`rupaog-dev` at the time of writing) in OpenShift. Save the TOKEN secret associated with the service account as a GitHub secret with the name `AUTH_TOKEN`.

### Database

The database used is based off of the OCIO RocketChat configuration found [here](https://github.com/BCDevOps/platform-services/blob/master/apps/rocketchat/template-mongodb.yaml). This defines a stateful set object with a default of three replicas. Database credentials are stored in a secret (HCAP uses the secret name of `hcap-mongodb`). The template also defines a persistent volume claim with the storage class `netapp-file-standard`.

To deploy the database to OpenShift, use the Makefile target `make db-create`.

To shell into the database, find the name of one of the pods created by the deployment (e.g. `hcap-mongodb-0`). Use the OpenShift CLI to remote shell into the pod via `oc rsh hcap-mongodb-0`. This will allow the user to use standard Mongo CLI commands (`mongo -u USERNAME -p PASSWORD DATABASE`) to interact with the data within the MongoDB replica set. This is far from an ideal way to access the data within the cluster and should be corrected.

At the time of writing, the DB schema was applied to the database by remote shelling into one of the application pods (`oc rsh hcap-server`) and running the relevant NPM script (`cd server && npm run db:seed`).

### Database Backups

Backups are enabled for the MongoDB database by means of the [backup-container](https://github.com/BCDevOps/backup-container) project published by the OCIO LabOps team. This method of backing up data was recommended instead of the [backup template](https://github.com/BCDevOps/platform-services/blob/master/apps/rocketchat/template-mongodb-backup.yaml) found in the OCIO RocketChat project.

For an in-depth explanation of the backup-container project, see the [project README](https://github.com/BCDevOps/backup-container/blob/master/README.md). In short, backups will be persisted to off-site storage as well as validated. Validation is accomplished by restoring the database backup to a temporary database and running one or more trivial queries against the DB.

At the time of writing, a [pull request](https://github.com/BCDevOps/backup-container/pull/63) has been created that provides an example of deploying a backup container for a MongoDB instance in OpenShift. The example is copied below for posterity.

1. Decide on amount of backup storage required (5Gi is currently the maximum)
2. Provision the nfs-backup PVC, following the [docs](https://github.com/BCDevOps/provision-nfs-apb/blob/master/docs/usage-gui.md). This provisioning may take several minutes to an hour, and if using the GUI, will result in a PVC with a name similar to `bk-abc123-dev-v9k7xgyvwdxm`, where `abc123-dev` is your project namespace and the last portion is randomly generated.
3. `git clone https://github.com/BCDevOps/backup-container.git && cd backup-container`.
4. Determine the OpenShift namespace for the image (e.g. `abc123-dev`), the app name (e.g. `myapp-backup`), and the image tag (e.g. `v1`). Then build the image in your the namespace.
```bash
oc -n abc123-dev process -f ./openshift/templates/backup/backup-build.json \
  -p DOCKER_FILE_PATH=Dockerfile_Mongo
  -p NAME=myapp-backup OUTPUT_IMAGE_TAG=v1 | oc -n abc123-dev create -f -
```
5. Configure `./config/backup.conf`. This defines the database(s) to backup and the schedule that backups are to follow. Additionally, this sets up backup validation (identified by `-v all` flag).
```bash
# Database(s)
mongo=myapp-mongodb:27017/mydb

# Cron Schedule(s)
0 1 * * * default ./backup.sh -s
0 4 * * * default ./backup.sh -s -v all
```
6. Configure references to your DB credentials in [backup-deploy.json](https://github.com/BCDevOps/backup-container/blob/master/openshift/templates/backup/backup-deploy.json), replacing the boilerplate `DATABASE_USER` and `DATABASE_PASSWORD` environment variable names. Note the hostname of the database to be backed up. This example uses a hostname of `myapp-mongodb` which maps to environment variables named `MYAPP_MONGODB_USER` and `MYAPP_MONGODB_PASSWORD`. See the [backup.conf](https://github.com/BCDevOps/backup-container/blob/master/README.md#backupconf) section  above for more in depth instructions. This example also assumes that the name of the secret containing your database username and password is the same as the provided `DATABASE_DEPLOYMENT_NAME` parameter. If that's not the case for your service, the secret name can be overridden.
```json
{
  "name": "MYAPP_MONGODB_USER",
  "valueFrom": {
    "secretKeyRef": {
      "name": "${DATABASE_DEPLOYMENT_NAME}",
      "key": "${DATABASE_USER_KEY_NAME}"
    }
  }
},
{
  "name": "MYAPP_MONGODB_PASSWORD",
  "valueFrom": {
    "secretKeyRef": {
      "name": "${DATABASE_DEPLOYMENT_NAME}",
      "key": "${DATABASE_PASSWORD_KEY_NAME}"
    }
  }
},
```
8. Deploy the app. In this example, the namespace is `abc123-dev` and the app name is `myapp-backup`. Note that the key names within the database secret referencing database username and password are `username` and `password`, respectively. If this is not the case for your deployment, specify the correct key names as parameters `DATABASE_USER_KEY_NAME` and `DATABASE_PASSWORD_KEY_NAME`. Also note that `BACKUP_VOLUME_NAME` is from Step 2 above.
```bash
oc -n abc123-dev create configmap backup-conf --from-file=./config/backup.conf
oc -n abc123-dev label configmap backup-conf app=myapp-backup

oc -n abc123-dev process -f ./openshift/templates/backup/backup-deploy.json \
  -p NAME=myapp-backup \
  -p IMAGE_NAMESPACE=abc123-dev \
  -p SOURCE_IMAGE_NAME=myapp-backup \
  -p TAG_NAME=v1 \
  -p BACKUP_VOLUME_NAME=bk-abc123-dev-v9k7xgyvwdxm \
  -p BACKUP_VOLUME_SIZE=5Gi \
  -p VERIFICATION_VOLUME_SIZE=10Gi \
  -p VERIFICATION_VOLUME_CLASS=netapp-block-standard \
  -p DATABASE_DEPLOYMENT_NAME=myapp-mongodb \
  -p DATABASE_USER_KEY_NAME=username \
  -p DATABASE_PASSWORD_KEY_NAME=password \
  -p ENVIRONMENT_FRIENDLY_NAME='My App MongoDB Backups' | oc -n abc123-dev create -f -
```

## License

    Copyright 2020 Province of British Columbia

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
