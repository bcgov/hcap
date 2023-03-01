/**
 * Tests for route /api/v1/phase
 */
import request from 'supertest';
import { app } from '../server';
import { startDB, closeDB } from './util/db';
import { getKeycloakToken, ministryOfHealth, healthAuthority } from './util/keycloak';
import { siteData } from './util/testData';
import { makeTestSite } from './util/integrationTestData';

describe('api e2e tests for /phase', () => {
  let server;
  beforeAll(async () => {
    await startDB();
    server = app.listen();
  });

  afterAll(async () => {
    await closeDB();
    await server.close();
  });

  it('should allow MOH to create phase', async () => {
    const header = await getKeycloakToken(ministryOfHealth);
    const res = await request(app)
      .post(`/api/v1/phase`)
      .send({
        name: 'Test Phase name',
        start_date: '2010/01/01',
        end_date: '2011/01/01',
      })
      .set(header);
    expect(res.status).toEqual(201);
  });

  it('should not allow MOH to create phase that starts on the same day the previous phase ended', async () => {
    const header = await getKeycloakToken(ministryOfHealth);
    const res = await request(app)
      .post(`/api/v1/phase`)
      .send({
        name: 'Test not same day',
        start_date: '2011/01/01',
        end_date: '2013/01/01',
      })
      .set(header);
    expect(res.status).toEqual(400);
  });

  it('should allow MOH to edit an existing phase', async () => {
    const header = await getKeycloakToken(ministryOfHealth);
    const res = await request(app)
      .patch(`/api/v1/phase/1`)
      .send({
        start_date: '2010/01/02',
        end_date: '2011/01/02',
      })
      .set(header);
    expect(res.status).toEqual(201);
  });

  it('should not allow MOH to create phase with overlapping date', async () => {
    const header = await getKeycloakToken(ministryOfHealth);
    const res = await request(app)
      .post(`/api/v1/phase`)
      .send({
        name: 'Test Phase name overlap Post',
        start_date: '2009/12/31',
        end_date: '2010/012/31',
      })
      .set(header);
    expect(res.status).toEqual(400);
  });

  it('should not allow HA to create phase', async () => {
    const header = await getKeycloakToken(healthAuthority);
    const res = await request(app)
      .post(`/api/v1/phase`)
      .send({
        name: 'Test HA Phase name',
        start_date: '2012/01/01',
        end_date: '2013/01/01',
      })
      .set(header);
    expect(res.status).toEqual(403);
  });

  it('should validate that end date is after start date - return error', async () => {
    const header = await getKeycloakToken(ministryOfHealth);
    const res = await request(app)
      .post(`/api/v1/phase`)
      .send({
        name: 'Test End date after Start error',
        start_date: '2012/01/01',
        end_date: '2011/12/31',
      })
      .set(header);
    expect(res.status).toEqual(400);
  });

  it('should allow MOH to create an additional phase - required to test overlapping validation on PATCH', async () => {
    const header = await getKeycloakToken(ministryOfHealth);
    const res = await request(app)
      .post(`/api/v1/phase`)
      .send({
        name: 'Test new phase',
        start_date: '2012/02/02',
        end_date: '2013/01/01',
      })
      .set(header);
    expect(res.status).toEqual(201);
  });

  it('should not allow MOH to edit an existing phase with overlapping dates', async () => {
    const header = await getKeycloakToken(ministryOfHealth);
    const res = await request(app)
      .patch(`/api/v1/phase/2`)
      .send({
        start_date: '2011/01/01',
        end_date: '2013/06/01',
      })
      .set(header);
    expect(res.status).toEqual(400);
  });

  it('should not allow HA to edit an existing phase', async () => {
    const header = await getKeycloakToken(healthAuthority);
    const res = await request(app)
      .patch(`/api/v1/phase/1`)
      .send({
        start_date: '2010/01/01',
        end_date: '2011/06/01',
      })
      .set(header);
    expect(res.status).toEqual(403);
  });

  it('should return phases', async () => {
    const header = await getKeycloakToken(healthAuthority);
    const res = await request(app).get(`/api/v1/phase`).set(header);
    expect(res.status).toEqual(200);
  });

  it('should return all phases with allocations', async () => {
    const siteMock = siteData({
      siteId: 7,
      siteName: 'Test phase',
      operatorEmail: 'test.e2e.phase@hcap.io',
    });
    const site = await makeTestSite(siteMock);
    const header = await getKeycloakToken(healthAuthority);
    const res = await request(app).get(`/api/v1/phase/${site.id}`).set(header);
    expect(res.status).toEqual(200);
  });
});
