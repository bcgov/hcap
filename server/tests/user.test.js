/* eslint-disable no-restricted-syntax, no-await-in-loop */
const { v4 } = require('uuid');
const { startDB, closeDB } = require('./util/db');
const { getUserSites, makeUser } = require('../services/user.js');
const { saveSites } = require('../services/employers.js');

describe('Users Service', () => {
  beforeAll(async () => {
    await startDB();
  });

  afterAll(async () => {
    await closeDB();
  });

  it('get user sites', async () => {
    const id = v4();

    const siteMocks = [
      {
        city: 'Osoyoos',
        isRHO: false,
        siteId: 5,
        address: '2020 New Rd',
        siteName: 'Spreadsheet Care',
        postalCode: 'A1A 1A1',
        operatorEmail: 'heather@ha.test.com',
        operatorPhone: '5555555555',
        healthAuthority: 'Interior',
        siteContactLastName: 'Contact',
        siteContactFirstName: 'Cathy',
        allocation: 20,
        registeredBusinessName: 'Interior Health Authority',
        siteContactPhoneNumber: '5555555555',
        operatorContactLastName: 'Haverston',
        siteContactEmailAddress: 'cathy@ha.test.com',
        operatorContactFirstName: 'Heather',
      },
    ];

    await saveSites(siteMocks);
    await makeUser({ keycloakId: id, sites: [5] });

    const sitesResult = await getUserSites(id);

    expect(sitesResult[0].siteId).toEqual(siteMocks[0].siteId);
  });
});
