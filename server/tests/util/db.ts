/* eslint-disable no-console, no-restricted-syntax, no-await-in-loop */
import { dbClient, collections } from '../../db';
import keycloak from '../../keycloak';

async function clearDB() {
  for (const value of Object.values(collections)) {
    await dbClient.db.dropTable(value, { cascade: true });
  }
  await dbClient.db.dropTable('pgmigrations', { cascade: true });
}

/**
 * Connect to database
 */
export async function startDB() {
  await dbClient.connect();
  await clearDB();
  await keycloak.buildInternalIdMap();
  await dbClient.runMigration();
}

export async function cleanDB() {
  await dbClient.db[collections.PARTICIPANTS_STATUS].destroy({});
  await dbClient.db[collections.PARTICIPANTS].destroy({});
  await dbClient.db[collections.EMPLOYER_SITES].destroy({});
}

export async function closeDB() {
  await clearDB();
  await dbClient.disconnect();
}
