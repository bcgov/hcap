# Development

## Table of Contents

1. [Prerequisites](#prerequisites)
1. [Setup and Development Commands](#setup-and-development-commands)
1. [Using the Application](#using-the-application)
1. [Public Front End Views](#public-front-end-views)
1. [Public API Routes](#public-api-routes)

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js](https://nodejs.org/en/) and [NPM](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
- [OpenShift CLI](https://docs.openshift.com/container-platform/4.12/cli_reference/openshift_cli/getting-started-cli.html#cli-getting-started) (If working with OpenShift)
- A working [WSL](https://learn.microsoft.com/en-us/windows/wsl/install) distro (if running on Windows)
  - If using WSL, make sure to run the project from a WSL directory (such as your Linux home directory), **not** a Windows directory (such as `/mnt/c/*`). Doing so prevents certain issues with Docker.
- Environment Variables
  - Refer to [the example file](.config/.env.example) for the required environment variables.

## Setup and Development Commands

### To set up and run database, backend (server), and frontend (client) applications:
- Run `npm i` within the root folder of the project to install NPM script dependencies
- Run `make local-build` within the root folder of the project to build the application
- Run `make local-run` within the root folder of the project to run the application

You should see the application running at `http://hcapemployers.local.freshworks.club:4000/` and `http://hcapparticipants.local.freshworks.club:4000/`.

### To seed the database with data in an Excel sheet:

- `make seed-sites SHEET=my_spreadsheet.xlsx`
- `make seed-participants SHEET=my_spreadsheet.xlsx`

**Note:** The input Excel file **must** be placed in `server/scripts/xlsx`. Test files can be found in `server/test-data`.

### To tear down your environment:

- Run `make local-close`
- Run `make local-clean`

### To create KC test users as well as assign roles:

- Run `make local-kc-build`
- Run `make local-kc-run`
- Run `make kc-import-users`
Go to `http://keycloak.local.freshworks.club:8080/auth` console and add users/assign roles under the client `hcap-fe-local`
- Run `make kc-export-users` to save your changes
`409 Conflict` errors are ok if the user already exists, only the role change will be applied

### To run server unit tests:

- Make sure containers are running
  - `make local-kc-run`
- Shell into the server container by running
  - `make local-server-workspace`
  - `npm test`
- or by running
  - `make local-server-tests`

### To run e2e tests:
- Make sure containers are running
  - `make local-kc-run`
- Make sure you've imported KC users into your local environment
  - `make kc-import-users`
- Tests can be run with
  - `make local-cypress-tests`

## Using the Application

The application's public routes can be accessed at http://hcapparticipants.local.freshworks.club:4000.

The application's private routes are located at http://hcapparticipants.local.freshworks.club:4000.
To access these, you'll need an account on the [BCeID test environment](https://www.test.bceid.ca/register/basic/account_details.aspx?type=regular&eServiceType=basic).
When you first log in, an access request will be created, which can be accepted by a teammate through `View Access Requests` or manually through Keycloak.
The access request will need to be approved separately on each environment.

## Public Front End Views

Path                   | Description
----                   | -----------
/                      | Allows an employer user to submit their expressions of interest
/employer-confirmation | Redirect here after form submission and display the expression of interest submitted
/login                 | Portal entry point for authenticated users to upload, view, and manage data

## Public API Routes

Path                        | Method | Description
----                        | ------ | -----------
/employer-form              | `POST` | Submit new employer expression of interest form
/keycloak-realm-client-info | `GET`  | Load config for login
/version                    | `GET`  | View deployed version of the application
/ (in production)           | `GET`  | Serves the built client app