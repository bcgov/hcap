# Health Career Access Program

### A component of the COVID-19 response

---

## Introduction

This is a digital service built for the Ministry of Health which supports British Columbian residents to apply for the Health Career Access Program (HCAP) during the COVID-19 pandemic.

## Available Scripts

In the server directory, you can run:

### `npm parse-xml`

Parses all xml files containing in the scripts/xml directory that follows the Orbeon format, including the file name,
and then submits to the /form endpoint. Example of file names:

- Health Career Access Program - Expression of Interest - 8353ec90e6ea8727.xml
- Health Career Access Program - Expression of Interest - 91113c10e0xx872x (1).xml

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
- Run `make local` within the root folder of the project

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

At a high level, the functions of each of these objects are as follows.

The *Build Config* defines how an image is built. Properties such as build strategy (Docker), repository (the very repository you're looking at), and rebuild triggers are defined within this object.

The *Image Stream* defines a stream of built images. Essentially, this is an image repository similar to Dockerhub. Images sent to the Image Stream must be tagged (e.g. `latest`).

The *Service* defines a hostname for a particular service exposed by a pod or set of pods. Services can only be seen and consumed by pods within the same OpenShift namespace. The service published by the HCAP application is the backend API endpoint. Similarly, the database will expose a service that is to be consumed by the application backend.

A *Route* exposes a service to the Internet. Routes differ from services in that they may only transmit HTTP traffic. As such, the database service could not be directly exposed to the Internet.

Finally, a *Deployment Config* defines how a new version of an application is to be deployed. Additionally, trigger for redeployment are defined wihtin this object. For the HCAP application, we've used a rolling deployment triggered by new images pushed to the image stream and tagged with the `latest` tag.

### GitHub Actions

A service account must be created and assigned permissions to trigger a build. Run `make os-permissons` to create a service account with admin credentials. The access token for this service account (accessible via Cluster Console > Administration > Service Accounts > Secrets) can be used to login and trigger a build and thus, a new deployment. GutHub Actions has been configured to trigger a new build in a specific namespace (`rupaog-dev` at the time of writing) in OpenShift. Save the TOKEN secret associated with the service account as a GitHub secret with the name `AUTH_TOKEN`.

### Database

The database used is based off of the OCIO RocketChat configureation found [here](https://github.com/BCDevOps/platform-services/blob/master/apps/rocketchat/template-mongodb.yaml). This defines a stateful set object with a default of three replicas. Database credentials are stored in a secret (HCAP uses the secret name of `hcap-mongodb`). The template also defines a persisten volume claim with the storage class `netapp-file-standard`.

To deploy the database to OpenShift, use the Makefile target `make db-create`.

To shell into the database, find the name of one of the pods created by the deployment (e.g. `hcap-mongodb-0`). The use the OpenShift CLI to remote shell into the pod `oc rsh hcap-mongodb-0`. This will allow the user to use standard Mongo CLI commands (`mongo -u USERNAME -p PASSWORD DATABASE`) to interact with the data within the MongoDB replica set. This is far from an ideal way to access the data within the cluster and should be corrected.

At the time of writing, the DB schema was applied to the database by remote shelling into one of the applicaiton pods (`oc rsh hcap-server`) and running the relevant NPM script (`cd server && npm run db:seed`).

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
