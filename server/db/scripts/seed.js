/* eslint-disable */
const { dbClient } = require('../db.js');
const { schema } = require('../schema.js');

//Postgres duplicated error code
const ERROR_DUPLICATED = '42P07';

// If run directly, will set up local DB
/* eslint-disable no-console */
(async () => {
  if (require.main === module) {
    try {
      console.log('Connecting with database server...');
      await dbClient.connect();

      for (const schemaItem of schema) {
        try {
          await dbClient.db.createDocumentTable(schemaItem.collection);
        } catch (err) {
          if (err.code !== ERROR_DUPLICATED) throw err;
        }
        for (const index of schemaItem.indexes) {
          try {
            await dbClient.db.query(index);
          } catch (err) {
            if (err.code !== ERROR_DUPLICATED) throw err;
          }
        }
      }
      console.log('Done.');
      return process.exit();
    } catch (error) {
      console.error(`Failed to create collections or indexes, ${error}`);
    }
  }
})();
/* eslint-enable no-console */
