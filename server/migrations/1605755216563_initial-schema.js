/* eslint-disable no-restricted-syntax, no-await-in-loop */
const { dbClient, schema } = require('../db');

exports.up = async () => {
  for (const schemaItem of schema.relationalTables) {
    await dbClient.runRawQuery(schemaItem.definition);
  }
  for (const schemaItem of schema.documentTables) {
    await dbClient.createDocumentTableIfNotExists(schemaItem.collection);
    for (const index of schemaItem.indexes) {
      await dbClient.createIndexIfNotExists(schemaItem.collection, index);
    }
  }
  await dbClient.reload(); // Required for subsequent migrations to see all tables
};
