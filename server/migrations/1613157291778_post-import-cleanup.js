/* eslint-disable max-len */
const { dbClient, collections } = require('../db');

exports.up = async () => {
  await dbClient.db.withTransaction(async (tx) => {
    await tx.query(`UPDATE ${collections.EMPLOYER_SITES} SET body = body - 'earlyAdopterAllocation' || jsonb_build_object('phaseOneAllocation', body->'earlyAdopterAllocation')`);

    await tx[collections.EMPLOYER_SITES].updateDoc(
      { postalCode: 'A1A 1A1' },
      { postalCode: '' },
    );

    await tx[collections.EMPLOYER_SITES].updateDoc(
      { operatorPhone: '5555555555' },
      { operatorPhone: '' },
    );

    await tx[collections.EMPLOYER_SITES].updateDoc(
      { siteContactPhoneNumber: '5555555555' },
      { siteContactPhoneNumber: '' },
    );

    await tx[collections.EMPLOYER_SITES].updateDoc(
      { operatorEmail: 'fake@test.com' },
      { operatorEmail: '' },
    );

    await tx[collections.EMPLOYER_SITES].updateDoc(
      { siteContactEmailAddress: 'fake@test.com' },
      { siteContactEmailAddress: '' },
    );

    await tx[collections.EMPLOYER_SITES].updateDoc(
      { operatorName: '(blank)' },
      { operatorName: '' },
    );

    await tx[collections.EMPLOYER_SITES].updateDoc(
      { operatorContactFirstName: '(blank)' },
      { operatorContactFirstName: '' },
    );

    await tx[collections.EMPLOYER_SITES].updateDoc(
      { operatorContactLastName: '(blank)' },
      { operatorContactLastName: '' },
    );

    await tx[collections.EMPLOYER_SITES].updateDoc(
      { siteContactFirstName: '(blank)' },
      { siteContactFirstName: '' },
    );

    await tx[collections.EMPLOYER_SITES].updateDoc(
      { siteContactLastName: '(blank)' },
      { siteContactLastName: '' },
    );
  });
};
