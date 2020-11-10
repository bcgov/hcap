/* eslint-disable no-console, no-restricted-syntax, no-await-in-loop */
const { dbClient, schema } = require('../../db');

async function seedDatabase() {
  for (const schemaItem of schema) {
    await dbClient.db.createDocumentTable(schemaItem.collection);
    for (const index of schemaItem.indexes) {
      await dbClient.db.query(index);
    }
  }
}

async function clearDB() {
  for (const schemaItem of schema) {
    await dbClient.db.dropTable(schemaItem.collection, { cascade: true });
  }
}

/**
 * Connect to database, and seed it
 */
async function startDB() {
  await dbClient.connect(true);
  await clearDB();
  await seedDatabase();
}

async function closeDB() {
  await clearDB();
}

module.exports = {
  seedDatabase,
  startDB,
  closeDB,
};
