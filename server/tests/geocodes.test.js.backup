/* eslint-disable no-restricted-syntax, no-await-in-loop */
const { v4 } = require('uuid');
const { startDB, closeDB } = require('./util/db');
const { getUserSites, makeUser } = require('../services/user.js');
const { saveSites } = require('../services/employers.js');
const { makeParticipant, getParticipants } = require('../services/participants.js');
const { getParticipantCoords } = require('../services/geocodes.js');

describe('Geocodes Service', () => {
  beforeAll(async () => {
    await startDB();
  });

  afterAll(async () => {
    await closeDB();
  });

  // Tests
  // Add participant, query for coords and compare
  // Update participant postal code, query for new coords
  // Add site, query for coords and compare
  // Update site postal codes, query for new coords

  it('Adds and updates a participant postal code, checking for coords', async () => {
    const participant = {
      maximusId: 648690,
      lastName: 'Extra',
      firstName: 'Eddy',
      postalCode: 'V0A2V3',
      postalCodeFsa: 'V1V',
      phoneNumber: '2502223333',
      emailAddress: 'eddy@example.com',
      interested: 'yes',
      nonHCAP: 'yes',
      crcClear: 'yes',
      preferredLocation: 'Fraser',
    };

    const res = await makeParticipant(participant);
    const coords = await getParticipantCoords(res.id);

    console.log(coords);
  });

  // it('Adds a site and updates the postal code, checking for coords', async () => {
  //   const id = v4();

  //   const siteMocks = [
  //     {
  //       city: 'Osoyoos',
  //       siteId: 5,
  //       address: '2020 New Rd',
  //       siteName: 'Spreadsheet Care',
  //       postalCode: 'A1A 1A1',
  //       operatorEmail: 'heather@ha.test.com',
  //       operatorPhone: '5555555555',
  //       healthAuthority: 'Interior',
  //       siteContactLastName: 'Contact',
  //       siteContactFirstName: 'Cathy',
  //       phaseOneAllocation: 20,
  //       registeredBusinessName: 'Interior Health Authority',
  //       siteContactPhoneNumber: '5555555555',
  //       operatorContactLastName: 'Haverston',
  //       siteContactEmailAddress: 'cathy@ha.test.com',
  //       operatorContactFirstName: 'Heather',
  //     },
  //   ];

  //   await saveSites(siteMocks);
  //   await makeUser({ keycloakId: id, sites: [5] });

  //   const sitesResult = await getUserSites(id);

  //   expect(sitesResult[0].siteId).toEqual(siteMocks[0].siteId);
  // });
});
