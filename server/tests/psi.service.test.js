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

  it('Seeds the database', async () => {
    allPSIs.forEach((psi) => makePSI(psi));
  });

  it('Confirms that all details are equal to submitted data', async () => {
    const psiList = await getPSIs();
    console.log(psiList);
    expect(psiList.length).toEqual(5);
    psiList.forEach((psi) => {
      const { id } = psi;
      const index = allPSIs.findIndex(
        (localEntry) => localEntry.healthAuthority === psi.healthAuthority
      );
      const query = getPSI(id);
      expect(allPSIs[index].instituteName).toEqual(query.instituteName);
      expect(allPSIs[index].postalCode).toEqual(query.postalCode);
      expect(allPSIs[index].healthAuthority).toEqual(query.healthAuthority);
    });
  });
});
