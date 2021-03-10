/* eslint-disable camelcase */
const { dbClient } = require('../db/db.js');
const { collections } = require('../db/schema.js');

exports.up = async () => {
  const results = await dbClient.db[collections.PARTICIPANTS].updateDoc(
    { callbackStatus: 'false' },
    { callbackStatus: false },
  );
  console.log(`Rows modified 'false' to false: ${results.length}`);
};
