/* eslint-disable no-console, no-restricted-syntax, no-await-in-loop */
const { dbClient } = require('../db.js');
const { schema } = require('../schema.js');

// Postgres duplicated error code
const ERROR_DUPLICATED = '42P07';

// If run directly, will set up local DB
(async () => {
  if (require.main === module) {
    try {
      console.log('Connecting with database server...');
      await dbClient.connect();

      console.log('Creating tables and indexes...');
      for (const schemaItem of schema) {
        try {
          await dbClient.db.createDocumentTable(schemaItem.collection);
          console.log(`'${schemaItem.collection}' table created.`);
        } catch (err) {
          if (err.code !== ERROR_DUPLICATED) {
            throw err;
          } else {
            console.log(`'${schemaItem.collection}' table already created, skipping...`);
          }
        }
        for (const index of schemaItem.indexes) {
          try {
            await dbClient.db.query(index);
            console.log(`${index} (Success)`);
          } catch (err) {
            if (err.code !== ERROR_DUPLICATED) {
              throw err;
            } else {
              console.log(`${index} (Already created, skipping...)`);
            }
          }
        }
      }
      console.log('Done.');
      return process.exit();
    } catch (error) {
      console.error(`Failed to create tables or indexes, ${error}`);
    }
  }
  return null;
})();
