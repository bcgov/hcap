# Deployment

## OpenShift Application

The Dockerized application is deployed to OpenShift using Makefile targets and YAML templates defined in the `openshift` directory.

To create the resources required to run the application in OpenShift, run `make server-create`. Optionally, a namespace prefix and/or suffix can be provided to target a namespace other than the default `rupaog-dev`, e.g. `NAMESPACE_SUFFIX=test make server-create`.

The OpenShift objects created are defined in the [openshift/server.bc.yml](openshift/server.bc.yml) and [openshift/server.dc.yml](openshift/server.dc.yml). At a high level, these objects include the following:


Object | Function
------ | --------
Build Config | Defines how an image is built. Properties such as build strategy (Docker), repository (the very repository you're looking at), and rebuild triggers are defined within this object.
Image Stream | Defines a stream of built images. Essentially, this is an image repository similar to DockerHub. Images sent to the Image Stream must be tagged (e.g. `latest`).
Service | Defines a hostname for a particular service exposed by a pod or set of pods. Services can only be seen and consumed by pods within the same OpenShift namespace. The service published by the HCAP application is the backend API endpoint. Similarly, the database will expose a service that is to be consumed by the application backend.
Route | Exposes a service to the Internet. Routes differ from services in that they may only transmit HTTP(S) traffic. As such, the database service could not be directly exposed to the Internet.
Deployment Config | Defines how a new version of an application is to be deployed. Additionally, triggers for redeployment are defined within this object. For the HCAP application, we've used a rolling deployment triggered by new images pushed to the image stream and tagged with the `latest` tag.
Secret |Defines values that can be used by pods within in the same namespace. While there are no secrets defined in our server application, there is a reference to a secret defined by the [MongoDB database template](openshift/mongo.yml). In order for the server to access the DB, it must be provided with `MONGODB_DATABASE` and `MONGODB_URI` environment variables. The definition for these environment variables can be found in the [server deployment config template](openshift/server.dc.yml). Note that they are referencing the `${APP_NAME}-mongodb` (resolves to `hcap-mongodb`) secret and the `mongo-url` and `database` keys within this secret.

## Deployment Process

The application uses a branch-based deployment strategy for development and test environments, and a tag-based approach for production.

### Development Environment

Deployments to the development environment can be triggered by these 3 approaches:

1. Creating and merging a PR to the `dev-env` branch
2. Manually triggering the "OpenShift Deploy/Promotion to Dev" workflow in GitHub Actions
3. Using the Makefile command for quick deployments without a PR:

```bash
# Deploy your current branch to dev
make deploy-to-dev ticket=BCMOHAM-12345
```

This command will:
- Get your current branch name
- Force push your current branch to the remote `dev-env` branch
- Trigger the GitHub Actions workflow for deployment to dev

### Test Environment

Deployments to the test environment follow a more controlled process:

1. Create a PR from `dev-env` to `test-env`
2. Get the PR reviewed and approved by the team
3. Merge the approved PR to update the `test-env` branch
4. Go to GitHub Actions
5. Select "OpenShift Deploy/Promotion to Test" workflow
6. Click "Run workflow"
7. Enter the ticket number (e.g., BCMOHAM-12345) in the reason field
8. Select the branch (`test-env`)
9. Submit the workflow
10. Wait for environment approval and deployment completion

Test deployments require:
- The ticket number
- PR approval from authorized team members
- Manual workflow trigger with proper documentation
- Final environment approval in GitHub Actions

### Production Environment (TODO)

Production deployments use a tag-based approach:

```bash
# Use the Makefile command
make tag-prod ticket=HCAP-123
```

This command will:
- Create a tag named `prod` pointing to your current commit
- Push it to the remote repository
- Trigger the GitHub Actions workflow for deployment to production

## Dev/Test Certificate Creation

Currently, the domains use a manually created lets encrypt certificate which is only valid for 90 days, this can easily be switched to a longer lived certificate from your favorite provider. Note: the foundrybc.ca certificate is valid for 1 year.

### Install Certbot

```
brew install certbot
```

### Certificate Generation

```
sudo certbot certonly --manual
```

Will prompt you for domain you want to secure. You can use a wildcard to cover participants and employers:

`*.<env>.freshworks.club`

Once provided, certbot will ask you to perform DNS verification for the domains above. The domain is managed by Azure DNS. Follow the instructions provided by certbot.

This will generate a couple of pem files (your new certificate)

### Adding certificates to Openshift Routes

Add the contents of `dev.freshworks.club/fullchain.pem` to the routes `hcap-participants` and `hcap-employers` at `spec.tls.certificate` and do the same for the contents of `dev.freshworks.club/privkey.pem` at `spec.tls.key`.

Click save and the certificates should be updated.
