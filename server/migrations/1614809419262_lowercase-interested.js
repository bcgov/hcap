/* eslint-disable max-len, no-console */
const { dbClient, collections } = require('../db');

exports.up = async () => {
  const results = await dbClient.db[collections.PARTICIPANTS].updateDoc(
    { interested: 'Yes' },
    { interested: 'yes' },
  );
  console.log(`Lowercase interested Yes rows affected: ${results.length}`);
};
