/* eslint-disable camelcase, no-console */
const { dbClient, collections } = require('../db');

exports.up = async () => {
  await dbClient.db.withTransaction(async (tx) => {
    await tx[collections.PARTICIPANTS].updateDoc(
      {
        postalCode: 'Z1Z1Z1',
      },
      { postalCode: '' }
    );

    await tx[collections.PARTICIPANTS].updateDoc(
      {
        nonHCAP: 'NULL',
      },
      { nonHCAP: '' }
    );

    await tx[collections.PARTICIPANTS].updateDoc(
      {
        crcClear: 'NULL',
      },
      { crcClear: '' }
    );
  });
};
