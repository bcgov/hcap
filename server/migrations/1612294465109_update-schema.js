/* eslint-disable no-restricted-syntax, no-await-in-loop */
const { schema } = require('../db/schema.js');
const { dbClient } = require('../db/db.js');

exports.up = async () => {
  for (const schemaItem of schema) {
    await dbClient.runRawQuery(schemaItem.participantsStatusTable);
  }
};
