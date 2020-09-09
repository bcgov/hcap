# Health Career Access Program

### A component of the COVID-19 response

---

## Introduction

This is a digital service built for the Ministry of Health which supports British Columbian residents to apply for the Health Career Access Program (HCAP) during the COVID-19 pandemic.

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

To report bugs/issues/feature requests, please file an [issue](https://github.com/bcgov-c/hcap/issues).

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

## Database

The application uses Amazon DocumentDB, a non-relational database, fully managed, that emulates the MongoDB 3.6 API and utilizes a distributed, fault-tolerant, self-healing storage system.

You can find more information at:
- https://aws.amazon.com/documentdb/
- https://docs.aws.amazon.com/documentdb/latest/developerguide/what-is.html

Keep in mind that DocumentDB does not support all MongoDB 3.6 features and APIs. Check the link below to explore the differences:
- https://docs.aws.amazon.com/documentdb/latest/developerguide/mongo-apis.html
- https://docs.aws.amazon.com/documentdb/latest/developerguide/functional-differences.html

For this project, there are 2 database clusters configured under private subnets inside a custom VPC. One to be used for development and staging environments and the other for the production environment.

For local development, a MongoDB 3.6 container is being used.

### Shelling into the Database [Development/Production]

Because the database clusters are not exposed to the web, we need to create a SSH tunnel to bridge a connection with the database. To do that, we need to use a bastion host inside the same VPC but exposed to the web.


```bash
ssh -i "~/.ssh/ets-bastion-host.pem" -L 27017:DOCUMENT_DB_CLUSTER_URL:27017 ec2-user@BASTION_HOST_URL -N
```

- Replace DOCUMENT_DB_CLUSTER_URL with the url the document db cluster.
- Replace BASTION_HOST_URL with the IP address or url of the bastion host.
- Now you can connect to the database using mongo shell or any mongo client as if the server was running from your localhost.
- Keep in mind, our DocumentDB clusters have TLS enabled and will require a public key to connect. You can downloaded it [here](https://s3.amazonaws.com/rds-downloads/rds-combined-ca-bundle.pem).


You can find the cluster URLS, credentials, and certificates on the project folder on TeamPass.

Find supplementary reference on the link below:
- https://docs.aws.amazon.com/documentdb/latest/developerguide/connect-from-outside-a-vpc.html

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
