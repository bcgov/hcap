## Database

This application uses both a PostgreSQL database as its main storage as well as a MongoDB database to store logging output.

### PostgreSQL

This database is based off of the BCDevExchange Lab's Patroni image found [here](https://github.com/bcgov/patroni-postgres-container). This defines a stateful set object with a default of three replicas. Database credentials are stored in a secret in OpenShift. The template also defines a persistent volume claim with the storage class `netapp-block-standard`.

To deploy the database to OpenShift, use the Makefile target `make db-prep` followed by  `make db-create`.

To tunnel into the databases, use `make db-postgres-tunnel`. In order to login to the OpenShift API, use the token in the OpenShift portal (click your name at the top right corner -> Copy login command).

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
