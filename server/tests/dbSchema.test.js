const { startDB, closeDB } = require('./util/db');
const { dbClient, collections } = require('../db');

describe('Test database schemas', () => {
  beforeAll(async () => {
    await startDB();
  });

  afterAll(async () => {
    await closeDB();
  });

  it('should store employer site object', async () => {
    const site = {
      siteId: 67,
      siteName: 'Test site',
      earlyAdaptorAllocation: 1,
      address: '123 XYZ',
      city: 'Victoria',
      healthAuthority: 'Vancouver Island',
      postalCode: 'V8V 1M5',
      registeredBusinessName: 'AAA',
      operatorContactFirstName: 'AABB',
      operatorContactLastName: 'CCC',
      operatorEmail: 'test@hcpa.fresh',
      operatorPhone: '2219909090',
      siteContactFirstName: 'NNN',
      siteContactLastName: 'PCP',
      siteContactPhoneNumber: '2219909091',
      siteContactEmailAddress: 'test.site@hcpa.fresh',
    };

    // Save test
    const result = await dbClient.db.saveDoc(collections.EMPLOYER_SITE, site);
    expect(result.id).toBeDefined();

    // Fetch test
    const fetch = await dbClient.db[collections.EMPLOYER_SITE].findDoc(result.id);
    expect(fetch.siteName).toEqual(site.siteName);
  });
});
