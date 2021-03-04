/* eslint-disable max-len, no-console */
const { dbClient } = require('../db/db.js');
const { collections } = require('../db/schema.js');

exports.up = async () => {
  const results = await dbClient.db[collections.PARTICIPANTS].updateDoc(
    { interested: 'Yes' },
    { interested: 'yes' },
  );
  console.log(`Lowercase interested Yes rows affected: ${results.length}`);
};
