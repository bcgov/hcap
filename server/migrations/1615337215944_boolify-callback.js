/* eslint-disable no-console */
const { dbClient, collections } = require('../db');

exports.up = async () => {
  await dbClient.db[collections.PARTICIPANTS].updateDoc(
    { callbackStatus: 'false' },
    { callbackStatus: false }
  );
};
