/* eslint-disable no-restricted-syntax, no-await-in-loop */
const { schema } = require('../db/schema.js');
const { dbClient } = require('../db/db.js');

exports.up = async () => {
  for (const schemaItem of schema) {
    await dbClient.createDocumentTableIfNotExists(schemaItem.collection);
    for (const index of schemaItem.indexes) {
      dbClient.createIndexIfNotExists(schemaItem.collection, index);
    }
  }
};
