/* eslint-disable no-restricted-syntax, no-await-in-loop */
import { v4 } from 'uuid';

import { startDB, closeDB } from './util/db';
import { getUserSites, makeUser } from '../services/user';
import { saveSites } from './util/mock';

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
