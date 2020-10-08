const { dbClient, schema } = require('../../db');

async function seedDatabase() {
  /* eslint-disable no-await-in-loop */
  /* eslint-disable no-restricted-syntax */
  for (const schemaItem of schema) {
    await dbClient.db.createDocumentTable(schemaItem.collection);
    for (const index of schemaItem.indexes) {
      await dbClient.db.query(index);
    }
  }
  /* eslint-enable no-await-in-loop */
  /* eslint-enable no-restricted-syntax */
}

async function clearDB() {
  /* eslint-disable no-await-in-loop */
  /* eslint-disable no-restricted-syntax */
  for (const schemaItem of schema) {
    await dbClient.db.dropTable(schemaItem.collection, { cascade: true });
  }
  /* eslint-enable no-await-in-loop */
  /* eslint-enable no-restricted-syntax */
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
