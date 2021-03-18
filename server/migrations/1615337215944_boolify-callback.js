/* eslint-disable no-console */
const { dbClient, collections } = require('../db');

exports.up = async () => {
  const results = await dbClient.db[collections.PARTICIPANTS].updateDoc(
    { callbackStatus: 'false' },
    { callbackStatus: false },
  );
  console.log(`Rows modified 'false' to false: ${results.length}`);
};
