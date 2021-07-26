/* eslint-disable no-restricted-syntax, no-await-in-loop */
const { startDB, closeDB } = require('./util/db');
const { getPSIs, getPSI, makePSI } = require('../services/post-secondary-institutes.js');

describe('Participants Service', () => {
  beforeAll(async () => {
    await startDB();
  });

  afterAll(async () => {
    await closeDB();
  });

  const regions = ['Fraser', 'Interior', 'Northern', 'Vancouver Coastal', 'Vancouver Island'];

  const allPSIs = [
    {
      instituteName: 'Test PSI 1',
      postalCode: 'V1V 2V2',
      healthAuthority: regions[0],
    },
    {
      instituteName: 'Test PSI 2',
      postalCode: 'V2V 3V3',
      healthAuthority: regions[1],
    },
    {
      instituteName: 'Test PSI 3',
      postalCode: 'V2V 3V4',
      healthAuthority: regions[2],
    },
    {
      instituteName: 'Test PSI 4',
      postalCode: 'V2V 3V5',
      healthAuthority: regions[3],
    },
    {
      instituteName: 'Test PSI 5',
      postalCode: 'V2V 3V6',
      healthAuthority: regions[4],
    },
  ];

  const badPostalCode = {
    instituteName: 'Golden',
    postalCode: '1.618',
    healthAuthority: 'Interior',
  };

  const badHA = {
    instituteName: 'London',
    postalCode: 'V1V 1V1',
    healthAuthority: 'Ontario',
  };

  const maliciousPSIEntry = {
    instituteName: "xkcd'); DROP TABLE post-secondary-institutions;--",
    postalCode: 'V1V 1V1',
    healthAuthority: 'Fraser',
  };

  it('Seeds the database, confirms that all details are equal to submitted data', async () => {
    await Promise.all(allPSIs.map((psi) => makePSI(psi)));
    const psiList = await getPSIs();
    expect(psiList.length).toEqual(5);
    psiList.forEach(async (psi) => {
      const { id } = psi;
      const index = allPSIs.findIndex(
        (localEntry) => localEntry.healthAuthority === psi.health_authority
      );
      const [query] = await getPSI(id);
      expect(allPSIs[index].instituteName).toEqual(query.institute_name);
      expect(allPSIs[index].postalCode).toEqual(query.postal_code);
      expect(allPSIs[index].healthAuthority).toEqual(query.health_authority);
    });
  });

  // Depends on above test
  it('Adds a duplicate site, checks for error', async () => {
    const dupe = await makePSI(allPSIs[0]);
    expect(dupe.code).toEqual('23505');
  });

  it('Adds a PSI with a bad postal code, checks for error', async () => {
    try {
      await makePSI(badPostalCode);
    } catch (error) {
      expect(error.name).toEqual('ValidationError');
    }
  });

  it('Adds a PSI with a bad health authority, checks for error', async () => {
    try {
      await makePSI(badHA);
    } catch (error) {
      expect(error.name).toEqual('ValidationError');
    }
  });

  it('Adds a malicious PSI to check sanitation', async () => {
    await makePSI(maliciousPSIEntry);
    const table = await getPSIs();
    expect(table.length).not.toEqual(0);
  });
});
