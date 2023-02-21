/**
 * Tests for route /api/v1/allocation
 */
import request from 'supertest';
import { app } from '../server';
import { startDB, closeDB } from './util/db';
import { getKeycloakToken, ministryOfHealth, healthAuthority } from './util/keycloak';
import { makeTestFKAllocations } from './util/integrationTestData';

describe('api e2e tests for /allocation', () => {
  let server;
  beforeAll(async () => {
    await startDB();
    server = app.listen();
  });

  afterAll(async () => {
    await closeDB();
    await server.close();
  });

  it('should set allocation to phase', async () => {
    const { site, phase } = await makeTestFKAllocations(52345);
    const header = await getKeycloakToken(ministryOfHealth);
    const res = await request(app)
      .post(`/api/v1/allocation`)
      .send({
        allocation: 50,
        phase_id: phase.id,
        site_id: site.id,
      })
      .set(header);
    expect(res.status).toEqual(201);
  });

  it('should edit an exisiting allocation', async () => {
    const header = await getKeycloakToken(ministryOfHealth);
    const res = await request(app)
      .patch(`/api/v1/allocation/1`)
      .send({
        allocation: 90,
      })
      .set(header);
    expect(res.status).toEqual(201);
  });

  it('should fail to set an allocation due to null validation', async () => {
    const header = await getKeycloakToken(ministryOfHealth);
    const res = await request(app)
      .patch(`/api/v1/allocation/1`)
      .send({
        allocation: null,
      })
      .set(header);
    expect(res.status).toEqual(400);
  });

  it('should fail to set an allocation due to `noUnknown` validation', async () => {
    const header = await getKeycloakToken(ministryOfHealth);
    const res = await request(app)
      .patch(`/api/v1/allocation/1`)
      .send({
        allocation: 30,
        startDate: new Date(),
      })
      .set(header);
    expect(res.status).toEqual(400);
  });

  it('should fail to edit an allocation due to unauthorized user', async () => {
    const header = await getKeycloakToken(healthAuthority);
    const res = await request(app)
      .patch(`/api/v1/allocation/1`)
      .send({
        allocation: 30,
        startDate: new Date(),
      })
      .set(header);
    expect(res.status).toEqual(403);
  });

  it('should fail to set an allocation due to unauthorized user', async () => {
    const { site, phase } = await makeTestFKAllocations(23621346);
    const header = await getKeycloakToken(healthAuthority);
    const res = await request(app)
      .post(`/api/v1/allocation`)
      .send({
        allocation: 50,
        phase_id: phase.id,
        site_id: site.id,
      })
      .set(header);
    expect(res.status).toEqual(403);
  });
});
