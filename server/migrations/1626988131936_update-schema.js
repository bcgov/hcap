/* eslint-disable no-restricted-syntax, no-await-in-loop */
import { dbClient, schema } from '../db';

exports.up = async () => {
  for (const schemaItem of schema.psiRelationalTables) {
    await dbClient.runRawQuery(schemaItem.definition);
  }
  await dbClient.reload(); // Required for subsequent migrations to see all tables
};
