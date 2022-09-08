/**
 * Tests for route /api/v1/employer-sites
 * Test Standalone execution: npm run test:debug employer.site.e2e.test
 */
const request = require('supertest');
const app = require('../server');
const { startDB, closeDB } = require('./util/db');
const { getKeycloakToken, superuser } = require('./util/keycloak');
const { saveSingleSite, saveSites } = require('../services/employers.js');

const siteObject = ({ id, name }) => ({
  siteId: id,
  siteName: name || 'Test site',
  allocation: 1,
  address: '123 XYZ',
  city: 'Victoria',
  isRHO: true,
  healthAuthority: 'Vancouver Island',
  postalCode: 'V8V 1M5',
  registeredBusinessName: 'AAA',
  operatorName: 'Test Operator',
  operatorContactFirstName: 'AABB',
  operatorContactLastName: 'CCC',
  operatorEmail: 'test@hcpa.fresh',
  operatorPhone: '2219909090',
  siteContactFirstName: 'NNN',
  siteContactLastName: 'PCP',
  siteContactPhone: '2219909091',
  siteContactEmail: 'test.site@hcpa.fresh',
});

/**
 * This method is required because different endpoints for creating/editing
 * sites have different names for similar fields (ie: siteContactPhone vs siteContactPhoneNumber)
 *
 * This method wraps siteObject() and renames those fields to pass validation
 *
 * @param {*} object containing an id and name used to create a test site
 * @returns an object containing the given id and name and the rest of the required fields for batch saving
 */
const batchSiteObject = ({ id, name }) => {
  const batchObject = {
    ...siteObject({ id, name }),
    siteContactPhoneNumber: siteObject.siteContactPhone,
    siteContactEmailAddress: siteObject.siteContactEmail,
  };
  delete batchObject.siteContactPhone;
  delete batchObject.siteContactEmail;
  return batchObject;
};

const getAllSitesExpectedFields = (site) => ({
  allocation: site.allocation,
  healthAuthority: site.healthAuthority,
  postalCode: site.postalCode,
  siteId: site.siteId,
  siteName: site.siteName,
  operatorName: site.operatorName,
});

describe('api-e2e tests for /employer-sites route', () => {
  let server;

  beforeAll(async () => {
    await startDB();
    server = app.listen();
  });

  afterAll(async () => {
    await closeDB();
    await server.close();
  });

  it('should save site', async () => {
    // Used for batch site POST
    const site = siteObject({ id: 61, name: 'Test Site 0' });
    const header = await getKeycloakToken(superuser);
    const res = await request(app).post('/api/v1/employer-sites').set(header).send(site);

    expect(res.status).toEqual(201);
  });

  it('should update site', async () => {
    const site = siteObject({ id: 91, name: 'Test Site 1' });

    const savedSite = await saveSingleSite(site);

    const update = {
      ...site,
      history: [
        {
          timestamp: new Date(),
          changes: [{ field: 'siteName', from: 'Test site', to: 'Test Site New' }],
        },
      ],
    };

    delete update.siteId;
    delete update.healthAuthority;

    const header = await getKeycloakToken(superuser);
    const res = await request(app)
      .patch(`/api/v1/employer-sites/${savedSite.id}`)
      .set(header)
      .send({ ...update });

    expect(res.status).toEqual(200);
  });

  it('should get sites', async () => {
    await closeDB();
    await startDB();

    const sites = [
      batchSiteObject({ id: 105, name: 'Test Site 1' }),
      batchSiteObject({ id: 106, name: 'Test Site 2' }),
      batchSiteObject({ id: 107, name: 'Test Site 3' }),
    ];

    await saveSites(sites);

    const header = await getKeycloakToken(superuser);
    const res = await request(app).get('/api/v1/employer-sites').set(header);
    expect(res.status).toEqual(200);
    expect(res.body.data.length).toEqual(3);
    expect(res.body.data).toEqual(
      expect.arrayContaining(
        sites.map((site) =>
          // using objectContaining because the API returns an ID after saving to the database
          expect.objectContaining(getAllSitesExpectedFields(site))
        )
      )
    );
  });

  it('should get site by id', async () => {
    const site = siteObject({ id: 108, name: 'FW Test Site 1' });
    const savedSite = await saveSingleSite(site);
    const header = await getKeycloakToken(superuser);
    const res = await request(app).get(`/api/v1/employer-sites/${savedSite.id}`).set(header);
    expect(res.status).toEqual(200);
    expect(res.body.id).toEqual(savedSite.id);
    expect(res.body.siteId).toEqual(site.siteId);
  });

  // TODO: Add basic smoke test on route. Need to add solid verification logic
  it('should get all participants of site by id', async () => {
    const site = siteObject({ id: 109, name: 'FW Test Site 1' });
    const savedSite = await saveSingleSite(site);
    const expected = {
      hired: [],
      withdrawn: [],
    };
    const header = await getKeycloakToken(superuser);
    const res = await request(app)
      .get(`/api/v1/employer-sites/${savedSite.id}/participants`)
      .set(header);
    expect(res.status).toEqual(200);
    expect(res.body).toEqual(expected);
  });

  it('should get employer-sites-detail', async () => {
    const header = await getKeycloakToken(superuser);
    const res = await request(app).get('/api/v1/employer-sites-detail').set(header).redirects();
    expect(res.status).toEqual(200);
  });
});
