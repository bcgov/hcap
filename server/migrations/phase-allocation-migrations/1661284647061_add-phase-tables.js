/* eslint-disable no-restricted-syntax, no-await-in-loop */
const { dbClient, schema } = require('../../db');

exports.shorthands = 'add-phase-tables';

exports.up = async () => {
  for (const schemaItem of schema.phaseTables) {
    await dbClient.runRawQuery(schemaItem.definition);
  }
  await dbClient.reload();
};
