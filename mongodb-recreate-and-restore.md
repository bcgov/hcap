This text document is for outlining the process necessary on a given
environment to create the backup from OCP3, create the backup from OCP4, spin
up a new instance of Mongo on OCP4 and then feed it data from the old backups
before scaling it up and removing the old database.

# OCP3 Backup

To begin the process, we log into Openshift with the command copied from the
web console:

$ oc login ...

Next, we make sure we are on the intended namespace by using:

$ oc project <name of project>

In this case, it is f047a2-dev. Once there, we list the available pods.

$ oc get pods

In previous deployments of MongoDB on Openshift, we did not have properly
configured replicasets with leaders, and so any pod will be sufficient for
taking a backup. In this case, we will assume one is called 'hcap-mongodb-0'.

$ oc rsh hcap-mongodb-0

Now that we've shelled into the pod on OCP3, we can use mongodump to create
a copy of the logs, using credentials from the console, found at Secrets ->
hcap-mongodb

sh-4.2$ mongodump -u <admin-username> -p <admin-password> -o ocp3-mongo-dump

Once this operation completes, it will create a `ocp3-mongo-dump` folder in the current
directory, which should be /opt/app-root/src/. Exit the remote shell.

In your working directory, the next step is to sync the dumped data onto the
local machine using the following command.

$ oc rsync hcap-mongodb-0:/opt/app-root/src/dump .

And with that, we have moved all of the mongo data from OCP3 onto the local
machine. Next, we need to spin up a new pod on OCP4 and restore it there.

# New Mongo Pod on OCP4

For this pod, we will be using a helm chart designed to enforce best
practices for mongo deployments. Specific parameters are held in
openshift/mongo.helm.yml, but we still need to configure helm to work on the
local machine.

Several options are documented here: https://helm.sh/docs/intro/install/

Once helm is installed, we need to log into OCP4 with the creds provided
by the web console, and then add the bitnami repo with the following command:

$ oc login ...
$ helm repo add bitnami https://charts.bitnami.com/bitnami

Now that bitnami is registered, we can use their helm chart to build a new
mongo deployment on Openshift. Make space by scaling down the existing
hcap-mongodb StatefulSet to one pod, and then delete the associated PVC in
Storage -> Persistent Volume Claims.

With the new space freed up, we can begin to spin up the new Mongo deployment
with helm. Run the following command from the root directory:

$ helm install hcap-mongo bitnami/mongodb -f openshift/mongo.helm.yml --set auth.username=<desired username> --set auth.database=<desired db name>

Once it completes, we will have 2 new mongo pods to work with and we can shift
logging duties over there with the server-new-mongo deployment config.

$ make server-create

After applying this update and re-deploying hcap-server, it will begin
directing logging towards the new mongo deployment. Now we can direct our focus
back towards the backups.

# OCP4 Backup

With OCP3 backed up onto your local machine, and the new mongo deployment
running, the next step is to back up the existing database of mongo logs on
OCP4. To do so, we need to make sure we're logged into OCP4 with the login
command provided by the console.

$ oc login ...

In this case, we need to use the local mongo tunnel functionality rather than
shelling in. This might work for the first case as well, but I haven't checked.
The operation requires port forwarding the pod on OCP4 to your local machine.
Once again, we can use any pod to dump data. In this case, we will once again
assume that we're using 'hcap-mongodb-0'

$ oc project <name of project>
$ oc get pods
$ oc port-forward hcap-mongodb-0 27017

Now that we're connected to the pod, we can switch to a different terminal pane
to perform the backup, using the secrets provided in the hcap-mongodb file on
OCP4 within the given namespace.

$ mongodump -u <admin-username> -p <admin-password> -o ocp4-mongo-dump

This will put all of the files from the ocp4 logs into a folder on your local
machine. With this, we have logs from both OCP3 and OCP4, so the transfer can
begin.

# Backup Restoration

Now that we have a service to direct traffic, we can use that to forward the
port.

$ oc port-forward service/hcap-mongo-headless 27017

With the above command running, we can run the mongorestore command to load our
backups onto the new deployment.

$ mongorestore --authenticationDatabase hcap -d hcap -u hcap -p LlHeh2drDp ocp3-mongo-dump/hcap
$ mongorestore --authenticationDatabase hcap -d hcap -u hcap -p LlHeh2drDp ocp4-mongo-dump/hcap

Once these commands have completed, the restoration is complete.
Congratulations!

Now all that's left is to remove the old mongo deployment and PVCs, scale up
our new mongo service to 3 pods with our newfound space, and delete the old
dump directories so we can move onto the next namespace!
