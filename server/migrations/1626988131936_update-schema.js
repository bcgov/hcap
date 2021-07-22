/* eslint-disable no-restricted-syntax, no-await-in-loop */
const { dbClient, schema } = require('../db');

exports.up = async () => {
  for (const schemaItem of schema.relationalTables) {
    await dbClient.runRawQuery(schemaItem.definition);
  }
  await dbClient.reload(); // Required for subsequent migrations to see all tables
};
