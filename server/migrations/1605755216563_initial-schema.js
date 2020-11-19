/* eslint-disable camelcase, no-restricted-syntax, no-await-in-loop */
const { schema } = require('../db/schema.js');
const { dbClient } = require('../db/db.js');

const ERROR_DUPLICATED = '42P07';

exports.up = async () => {
  await dbClient.connect();

  for (const schemaItem of schema) {
    try {
      await dbClient.db.createDocumentTable(schemaItem.collection);
    } catch (err) {
      if (err.code !== ERROR_DUPLICATED) {
        throw err;
      }
    }
    for (const index of schemaItem.indexes) {
      try {
        await dbClient.db.query(index);
      } catch (err) {
        if (err.code !== ERROR_DUPLICATED) {
          throw err;
        }
      }
    }
  }
};
