/**
 * Tests for route /api/v1/employer-sites
 * Test Standalone execution: npm run test:debug employer.site.e2e.test
 */
const request = require('supertest');
const app = require('../server');
const { startDB, closeDB } = require('./util/db');
const { getKeycloakToken, superuser } = require('./util/keycloak');
const { saveSingleSite } = require('../services/employers.js');

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
  siteContactPhoneNumber: '2219909091',
  siteContactEmailAddress: 'test.site@hcpa.fresh',
});

describe('api-e2e tests for /employer-sites route', () => {
  let server;

  beforeAll(async () => {
    server = app.listen();
  });

  afterAll(async () => {
    await server.close();
  });

  beforeEach(async () => {
    await startDB();
  });

  afterEach(async () => {
    await closeDB();
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
    const site = siteObject({ id: 105, name: 'FW Test Site' });
    await saveSingleSite(site);
    const header = await getKeycloakToken(superuser);
    const res = await request(app).get('/api/v1/employer-sites').set(header);
    expect(res.status).toEqual(200);
    expect(res.body.data.length).toEqual(1);
    expect(res.body.data).toEqual([
      {
        id: 1,
        allocation: site.allocation.toString(),
        healthAuthority: site.healthAuthority,
        postalCode: site.postalCode,
        siteId: site.siteId.toString(),
        siteName: site.siteName,
        operatorName: site.operatorName,
      },
    ]);
  });

  it('should get site by id', async () => {
    const site = siteObject({ id: 106, name: 'FW Test Site 1' });
    const savedSite = await saveSingleSite(site);
    const header = await getKeycloakToken(superuser);
    const res = await request(app).get(`/api/v1/employer-sites/${savedSite.id}`).set(header);
    expect(res.status).toEqual(200);
    expect(res.body.id).toEqual(savedSite.id);
    expect(res.body.siteId).toEqual(site.siteId);
  });

  // TODO: Add basic smoke test on route. Need to add solid verification logic
  it('should get all participants of site by id', async () => {
    const site = siteObject({ id: 107, name: 'FW Test Site 1' });
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
