const request = require('supertest');
const app = require('../server');
const { startDB, closeDB } = require('./util/db');
const { getKeycloakToken, superuser, employer } = require('./util/keycloak');
const { saveSingleSite } = require('../services/employers.js');

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
    const site = {
      siteId: 67,
      siteName: 'Test site',
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
    };
    const header = await getKeycloakToken(superuser);
    const res = await request(app).post('/api/v1/employer-sites').set(header).send(site);

    expect(res.status).toEqual(201);
  });

  it('should update site', async () => {
    const site = {
      siteId: 99,
      siteName: 'Test site',
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
    };

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
    delete update.operatorName;

    const header = await getKeycloakToken(superuser);
    const res = await request(app)
      .patch(`/api/v1/employer-sites/${savedSite.id}`)
      .set(header)
      .send({ ...update });

    expect(res.status).toEqual(200);
  });
});
