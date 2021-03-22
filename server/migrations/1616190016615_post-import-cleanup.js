/* eslint-disable camelcase, no-console */
const { dbClient, collections } = require('../db');

exports.up = async () => {
  await dbClient.db.withTransaction(async (tx) => {
    const postalCodes = await tx[collections.PARTICIPANTS].updateDoc(
      {
        postalCode: 'Z1Z1Z1',
      },
      { postalCode: '' },
    );

    const nonHCAPs = await tx[collections.PARTICIPANTS].updateDoc(
      {
        nonHCAP: 'NULL',
      },
      { nonHCAP: '' },
    );

    const crcClears = await tx[collections.PARTICIPANTS].updateDoc(
      {
        crcClear: 'NULL',
      },
      { crcClear: '' },
    );

    console.log(`Updated ${postalCodes.length} postalCode fields`);
    console.log(`Updated ${nonHCAPs.length} nonHCAP fields`);
    console.log(`Updated ${crcClears.length} crcClear fields`);
  });
};
