const { dbClient, schema } = require('../../db');

async function seedDatabase() {
  // Create collections if needed
  await Promise.all(schema.map(async (schemaItem) => {
    await dbClient.db.createCollection(schemaItem.collection);
  }));

  // Create collection indexes if needed
  const results = [];
  schema.forEach((schemaItem) => {
    const schemaItemCollection = dbClient.db.collection(schemaItem.collection);
    schemaItem.indexes.forEach((index) => {
      results.push(schemaItemCollection.createIndex({ [index.key]: 1 }, index.options));
    });
  });

  await Promise.all(results); // Wait for all synchronous operations to pass/fail
}

async function clearDB() {
  const collectionsToDelete = await dbClient.db.collections();

  const results = [];
  collectionsToDelete.forEach((collection) => {
    results.push(collection.deleteOne());
  });

  return Promise.all(results); // Wait for all synchronous operations to pass/fail
}

/**
 * Connect to Mongo DB, and seed it
 */
async function startDB() {
  await dbClient.connect();
  dbClient.useDB('TEST_DB');
  await clearDB();
  await seedDatabase();
}

async function closeDB() {
  await dbClient.disconnect();
  await clearDB();
}

module.exports = {
  seedDatabase,
  startDB,
  closeDB,
};
