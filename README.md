# Health Career Access Program (HCAP) Expression of Interest and Employer Portal

### A component of the COVID-19 response

---

## Introduction

This is a digital service built for the Ministry of Health which supports British Columbian residents and health care employers to apply for the Health Career Access Program (HCAP) during the COVID-19 pandemic. HCAP is a paid work and training initiative for individuals seeking an entry point to employment in health. The Portal collects expressions of interest in the program, manages employer-participant matching, and reports ongoing data on participant and employer progress.

## Table of Contents

1. [Project Status](#project-status)
1. [Features](#features)
1. [Getting Help or Reporting an Issue](#getting-help-or-reporting-an-issue)
1. [How to Contribute](#how-to-contribute)
1. [Development](#development)
1. [License](#license)

## Project Status

[![img](https://img.shields.io/badge/Lifecycle-Maturing-007EC6)](https://github.com/bcgov/repomountie/blob/master/doc/lifecycle-badges.md)

This application is in active development.

## Features

This project includes the following features:

1. Public web form for Employer Expression of Interest (EEOI) submissions
1. HCAP Employer Portal providing secure data upload, access, and reporting

## Getting Help or Reporting an Issue

To report bugs/issues/feature requests, please file an [issue](https://github.com/bcgov/hcap/issues).

## How to Contribute

If you would like to contribute, please see our [contributing](CONTRIBUTING.md) guidelines.

Please note that this project is released with a [Contributor Code of Conduct](CODE-OF-CONDUCT.md). By participating in this project you agree to abide by its terms.

## Development

### Pre-Requisites:

- Make sure you have Docker and Docker-compose installed in your local environment. For instructions on how to install it, follow the links below:
  - https://docs.docker.com/get-docker/
  - https://docs.docker.com/compose/install/

- Environment Variables
  - Refer to [the example file](.config/.env.example) for the required environment variables.

### How-To

To set up and run database, backend (server), and frontend (client) applications:
- Run `make local-build` within the root folder of the project to build the application
- Run `make local-run` within the root folder of the project to run the application
- You should see the application running at `localhost:4000`

To seed the database with data in an Excel sheet:

- `make seed-sites SHEET=my_spreadsheet.xlsx`
- `make seed-participants SHEET=my_spreadsheet.xlsx`

**Note:** The Excel file should be placed in `server/scripts/xlsx`.

To tear down your environment:
- Run `make local-close`
- Run `make local-clean`

To create KC test users as well as assign roles:
- Run `make local-kc-build`
- Run `make local-kc-run`
- Run `make kc-import-users`
Go to `http://keycloak.local.freshworks.club:8080/auth` console and add users/assign roles under the client `hcap-fe-local`
- Run `make kc-export-users` to save your changes
`409 Conflict` errors are ok if the user already exists, only the role change will be applied

To run server tests:
- Make sure containers are running
  - `make local-kc-run`
- Shell into the server container by running
  - `make local-server-workspace`
  - `npm test`
- or by running
  - `make local-server-tests`
- Cypress tests may be run with
  - `make local-cypress-tests`

### Using the application

The application's public routes can be accessed at http://hcapparticipants.local.freshworks.club:4000.

The application's private routes are located at http://hcapparticipants.local.freshworks.club:4000,
you'll need an account on the [BCeID test environment](https://www.test.bceid.ca/register/basic/account_details.aspx?type=regular&eServiceType=basic).
When you first log in an access request will be created and it can be accepted by a teammate through `View Access Requests` or manually through keycloak.
The access request will need to be approved separately on each environment.

### Formatting

This project is formatted with prettier, make sure to install the [VSCode extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode).

**Note:** If you didn't have prettier installed previously, be sure to enable  `"prettier.requireConfig": true,` to avoid formatting files without configurations.

### Public Front End Views

##### /
 - allows an employer user to submit their expressions of interest

##### /employer-confirmation
 - redirect here after form submission and display the expression of interest submitted

##### /login
 - Portal entry point for authenticated users to upload, view, and manage data

### Public API Routes

- /employer-form [POST] submit new employer expression of interest form
- /keycloak-realm-client-info [GET] load config for login
- /version [GET] view deployed version of the application
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

### Available Scripts

**Note:** [jq](https://stedolan.github.io/jq/) is a dependencdy for many scripts used in this project.

In the server directory, you can run:

#### `npm run parse-xml`

Parses all xml files containing in the scripts/xml directory that follows the Orbeon format, including the file name,
and then submits to the /form endpoint. Example of file names:

- Health Career Access Program - Expression of Interest - 8353ec90e6ea8727.xml
- Health Career Access Program - Expression of Interest - 91113c10e0xx872x (1).xml

#### `npm run feed-sites my_spreadsheet.xlsx` and `npm run feed-participants my_spreadsheet.xlsx`

Parses a given xlsx file inside the `server/scripts/xlsx/` folder and feeds either the `employer_sites` or `participants` table.

If you've spun up the application using Docker Compose i.e. `make local-run`, you can run the site seeding script with either of the following make commands:

- `make seed-participants my_spreadsheet.xlsx`
- `make seed-sites my_spreadsheet.xlsx`

N.B. - The sample seed files are available in Slack channel pinned item.

#### `npm run stats`

Shows the EEOI submission stats of a given period of days. (Before running this command, make sure that you have logged in to the OpenShift CLI and ran `make db-postgres-tunnel`)

#### `npm run export`

Exports all EEOI submissions from the database as a CSV file. (Before running this command, make sure that you have logged in to the OpenShift CLI and ran `make db-postgres-tunnel`)

#### `npm run participant-stats-in-progress`

Exports all participants In Progress from the database as a CSV file. (Before running this command, make sure that you have logged in to the OpenShift CLI and ran `make db-postgres-tunnel`)

#### `npm run participant-stats-hired`

Exports all hired participants from the database as a CSV file. (Before running this command, make sure that you have logged in to the OpenShift CLI and ran `make db-postgres-tunnel`). Records employer ID, position type, site.

#### `npm run participant-stats-rejected`

Exports all rejected participants from the database as a CSV file. (Before running this command, make sure that you have logged in to the OpenShift CLI and ran `make db-postgres-tunnel`). Records participant ID, employer ID, employer email, employer health regions and the reason and date of rejection.

#### `npm run participant-stats-no-offers`

Exports participants from the database as a CSV file who have not: withdrawn from the program; been hired; or had an offer made by any employer. Participants exclusively interested in the Northern Health Authority are also excluded as additional participant engagement support is not required for this region. (Before running this command, make sure that you have logged in to the OpenShift CLI and ran `make db-postgres-tunnel`). Records participant ID, email address, preferred health regions, current interest indicator, and the date the record was last updated. The results of this report must be handled appropriately as PII.

### Database

This application uses both a PostgreSQL database as its main storage as well as a MongoDB database to store logging output.

### PostgreSQL

This database is based off of the BCDevExchange Lab's Patroni image found [here](https://github.com/bcgov/patroni-postgres-container). This defines a stateful set object with a default of three replicas. Database credentials are stored in a secret in OpenShift. The template also defines a persistent volume claim with the storage class `netapp-block-standard`.

To deploy the database to OpenShift, use the Makefile target `make db-prep` followed by  `make db-create`.

### MongoDB

The database used is based off of the OCIO RocketChat configuration found [here](https://github.com/BCDevOps/platform-services/blob/master/apps/rocketchat/template-mongodb.yaml). This defines a stateful set object with a default of three replicas. Database credentials are stored in a secret (HCAP uses the secret name of `hcap-mongodb`). The template also defines a persistent volume claim with the storage class `netapp-file-standard`.

### Database Backups

Backups are enabled by means of the [backup-container](https://github.com/BCDevOps/backup-container) project published by the OCIO LabOps team. This method of backing up data was recommended instead of the [backup template](https://github.com/BCDevOps/platform-services/blob/master/apps/rocketchat/template-mongodb-backup.yaml) found in the OCIO RocketChat project.

For an in-depth explanation of the backup-container project, see the [project README](https://github.com/BCDevOps/backup-container/blob/master/README.md). In short, backups will be persisted to off-site storage as well as validated. Validation is accomplished by restoring the database backup to a temporary database and running one or more trivial queries against the DB.

### Migrations

In the server directory, you can run:

#### `npm run migrate create my-migration-script`

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


