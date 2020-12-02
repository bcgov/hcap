/* eslint-disable no-console, no-restricted-syntax, no-await-in-loop */
const { dbClient, collections } = require('../../db');

async function clearDB() {
  for (const value of Object.values(collections)) {
    await dbClient.db.dropTable(value, { cascade: true });
  }
  await dbClient.db.dropTable('pgmigrations', { cascade: true });
}

/**
 * Connect to database
 */
async function startDB() {
  await dbClient.connect(true);
  await clearDB();
  await dbClient.runMigration(true);
}

async function closeDB() {
  await clearDB();
}

module.exports = {
  startDB,
  closeDB,
};
