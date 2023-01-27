# Health Career Access Program (HCAP) Expression of Interest and Employer Portal

## A component of the COVID-19 response

---

## Introduction

This is a digital service built for the Ministry of Health which supports British Columbian residents and health care employers to apply for the Health Career Access Program (HCAP) during the COVID-19 pandemic. HCAP is a paid work and training initiative for individuals seeking an entry point to employment in health. The Portal collects expressions of interest in the program, manages employer-participant matching, and reports ongoing data on participant and employer progress.

## Table of Contents

1. [Project Status](#project-status)
1. [Features](#features)
    1. [Feature Flags](#feature-flags)
1. [Getting Help or Reporting an Issue](#getting-help-or-reporting-an-issue)
1. [How to Contribute](#how-to-contribute)
1. [Development](#development)
1. [Formatting](#formatting)
1. [Deployment](#deployment)
1. [GitHub Actions](#github-actions)
1. [Available Scripts](#available-scripts)
1. [Database](#database)
1. [License](#license)

## Project Status

[![img](https://img.shields.io/badge/Lifecycle-Maturing-007EC6)](https://github.com/bcgov/repomountie/blob/master/doc/lifecycle-badges.md)

This application is in active development.

## Features

This project includes the following features:

1. Public web form for Employer Expression of Interest (EEOI) submissions
1. HCAP Employer Portal, providing secure data upload, access, and reporting

### Feature Flags

As a method to improve deployment frequency, this project utilizes flags on some features.

Feature flags are set as environment variables on the server which are then sent to the client.

#### Setting feature flags

##### Local development

Add a line to your local `.env` file in the following format:

```
<Feature_Key>=true
```

##### Openshift

The server's deployment config references a `hcap-feature-flags` config map.
This config map contains the environment variables used for feature flagging.
These flags are set per-environment.

*Note:* The flag will only be enabled if the environment variable's value is exactly `true` any other values will be treated as false

## Getting Help or Reporting an Issue

To report bugs/issues/feature requests, please file an [issue](https://github.com/bcgov/hcap/issues).

## How to Contribute

If you would like to contribute, please see our [contributing](CONTRIBUTING.md) guidelines.

Please note that this project is released with a [Contributor Code of Conduct](CODE-OF-CONDUCT.md). By participating in this project you agree to abide by its terms.

## Development

For development, you'll need [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) installed.

To set up your development environment:
- Run `make local-build` within the root folder of the project to build the application
- Run `make local-run` within the root folder of the project to run the application

You should see the application running at `localhost:4000`.

See [*Development*](docs/development.md) for more details.

## Formatting

This project is formatted with prettier, make sure to install the [VSCode extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode).

**Note:** If you didn't have prettier installed previously, be sure to enable `"prettier.requireConfig": true,` to avoid formatting files without configurations.

## Deployment

See [*Deployment*](docs/deployment.md) for details.

## GitHub Actions

A service account must be created and assigned permissions to trigger a build. Run `make os-permissions` to create a service account with admin credentials. The access token for this service account (accessible via Cluster Console > Administration > Service Accounts > Secrets) can be used to login and trigger a build and thus, a new deployment. GitHub Actions has been configured to trigger a new build in a specific namespace (`rupaog-dev` at the time of writing) in OpenShift. Save the TOKEN secret associated with the service account as a GitHub secret with the name `AUTH_TOKEN`.

## Available Scripts

**Note:** [jq](https://stedolan.github.io/jq/) is a dependency for many scripts used in this project.

In the server directory, you can run the following scripts:

Script | Description | Requires Openshift Login
------ | ----------- | ------------------------
`npm run parse-xml` | Parses all xml files containing in the scripts/xml directory that follows the Orbeon format, including the file name, and then submits to the /form endpoint. | No 
`npm run feed-sites [filename].xlsx` | Parses a given xlsx file inside the `server/scripts/xlsx/` folder and feeds it to the `employer_sites` table. <br> If you've spun up the application using Docker Compose, i.e. `make local-run`, you can run the site seeding script with the following make command: <br> `make seed-sites [filename].xlsx` | No
`npm run feed-participants [filename].xlsx` | Parses a given xlsx file inside the `server/scripts/xlsx/` folder and feeds it to the `participants` table. <br> If you've spun up the application using Docker Compose, i.e. `make local-run`, you can run the participant seeding script with the following make command: <br> `make seed-participants my_spreadsheet.xlsx` | No
`npm run stats` | Shows the EEOI submission stats of a given period of days. | Yes
`npm run export` | Exports all EEOI submissions from the database as a CSV file. (Before running this command, make sure that you have logged in to the OpenShift CLI and ran `make db-postgres-tunnel`)
`npm run participant-stats-in-progress` | Exports all participants In Progress from the database as a CSV file. | Yes
`npm run participant-stats-hired` | Exports all hired participants from the database as a CSV file. Exports all rejected participants from the database as a CSV file. (Before running this command, make sure that you have logged in to the OpenShift CLI and ran `make db-postgres-tunnel`). Records participant ID, employer ID, employer email, employer health regions and the reason and date of rejection. | Yes
`npm run participant-stats-no-offers` | Exports participants from the database as a CSV file who have not: withdrawn from the program; been hired; or had an offer made by any employer. Participants exclusively interested in the Northern Health Authority are also excluded as additional participant engagement support is not required for this region.  Records participant ID, email address, preferred health regions, current interest indicator, and the date the record was last updated. The results of this report must be handled appropriately as PII. | Yes

Before running commands marked with "Requires Openshift Login", make sure that you have logged in to the OpenShift CLI and ran `make db-postgres-tunnel`.

## Database

This application uses both a PostgreSQL database as its main storage as well as a MongoDB database to store logging output.

For more information, see [*Database*](docs/database.md).

## License

```txt
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
```