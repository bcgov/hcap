# SSL Certificates Renewal Process

SSL certificates for the Dev and Test environments are automatically renewed using let's encrypt through a tool called openshift-acme.

## Openshift-ACME

### What is ACME?

Automatic Certificate Management Environment (ACME) protocol is a communications protocol for automating interactions between certificate authorities and their users’ web servers, allowing the automated deployment of public key infrastructure at very low cost (Source).

### How does Openshift-ACME work?

[*Openshift-ACME*](docs/ssl-certificates-renewal.md) is a ACME controller for Openshift and Kubernetes that automatically provisions certificates from Let’s Encrypt CA using ACME v2 protocol and manage their lifecycle including automatic renewals. 

The controller was written in Go language and is deployed using an Openshift Deployment script.

The ACME controller/service listens to changes to routes and keep track of certificate lifecyles. It will automatically start a certificate renewal process when required.

As part of the renewal process, Openshift-ACME exposes a new temporary route on Openshift pointing to an auto-generated static file that is used to validate domain name ownership over a specific Openshift route (subdomain name).

### How is Openshift-ACME set up on this project?

Openshift-ACME was deployed using the [Single Namespace deployment strategy](https://github.com/tnozicka/openshift-acme/tree/master/deploy#single-namespace).

#### Considerations
* Read all the deployment documentation mentioned above carefully.
* All YAML files need to be deployed:
    * role
    * serviceaccount
    * issuer-letsencrypt-live
    * deployment
* Do not forget to run the rolebinding command mentioned on the documentation.
* You will see permissions problems if roles, service account or the role binding was not properly deployed.
* After everything is deployed/configured, and the controlers starts to run, no further configuration around the tool should be required. 
    * Openshift-acme does not require the use of special letsencrypt crendetials.

#### How to enable certificates renewal for new routes

Given that openshift-acme controller is running on the namespace, all we have to do to enable it is to annotate the new Route or other supported object like this:
```yaml
metadata:
  annotations:
    kubernetes.io/tls-acme: "true"
```

### Renewal Lifetime

OpenShift-ACME documentation is not clear about when specifically the service triggers a certificate renewal, but the [documentation on the tool architecture](https://github.com/tnozicka/openshift-acme/blob/master/docs/design/architecture.adoc) suggests that it triggers that at 1/2 to 1/3 of a certificate lifetime.



