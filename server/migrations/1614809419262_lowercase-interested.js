/* eslint-disable max-len, no-console */
const { dbClient, collections } = require('../db');

exports.up = async () => {
  await dbClient.db[collections.PARTICIPANTS].updateDoc(
    { interested: 'Yes' },
    { interested: 'yes' }
  );
};
