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

  describe('POST /', () => {
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

    it('should fail to set an allocation due to negative number', async () => {
      const { site, phase } = await makeTestFKAllocations(25134776);
      const header = await getKeycloakToken(ministryOfHealth);
      const res = await request(app)
        .post(`/api/v1/allocation`)
        .send({
          allocation: -50,
          phase_id: phase.id,
          site_id: site.id,
        })
        .set(header);
      expect(res.status).toEqual(400);
    });

    it('should fail to set allocation if exists', async () => {
      const { site, phase } = await makeTestFKAllocations(525234345);
      const header = await getKeycloakToken(ministryOfHealth);
      const successRes = await request(app)
        .post(`/api/v1/allocation`)
        .send({
          allocation: 50,
          phase_id: phase.id,
          site_id: site.id,
        })
        .set(header);
      expect(successRes.status).toEqual(201);
      const failureRes = await request(app)
        .post(`/api/v1/allocation`)
        .send({
          allocation: 100,
          phase_id: phase.id,
          site_id: site.id,
        })
        .set(header);
      expect(failureRes.status).toEqual(400);
    });
  });

  describe('PATCH /:id', () => {
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
  });

  describe('POST /bulk-allocation', () => {
    it('should set bulk allocations to phase', async () => {
      const { site, phase } = await makeTestFKAllocations(847583759);
      const header = await getKeycloakToken(ministryOfHealth);
      const res = await request(app)
        .post(`/api/v1/allocation/bulk-allocation`)
        .send({
          allocation: 50,
          phase_id: phase.id,
          siteIds: [site.id],
        })
        .set(header);
      expect(res.status).toEqual(201);
    });

    it('should fail to set a bulk allocation due to unauthorized user', async () => {
      const { site, phase } = await makeTestFKAllocations(1122);
      const header = await getKeycloakToken(healthAuthority);
      const res = await request(app)
        .post(`/api/v1/allocation/bulk-allocation`)
        .send({
          allocation: 50,
          phase_id: phase.id,
          siteIds: [site.id],
        })
        .set(header);
      expect(res.status).toEqual(403);
    });

    it('should fail to set a bulk allocation due to `noUnknown` validation', async () => {
      const header = await getKeycloakToken(ministryOfHealth);
      const { site, phase } = await makeTestFKAllocations(573857);
      const res = await request(app)
        .post(`/api/v1/allocation/bulk-allocation`)
        .send({
          allocation: 50,
          phase_id: phase.id,
          siteIds: [site.id],
          start_date: new Date(),
        })
        .set(header);
      expect(res.status).toEqual(400);
    });

    it('should fail to set a bulk allocation due to `no negative` validation', async () => {
      const header = await getKeycloakToken(ministryOfHealth);
      const { site, phase } = await makeTestFKAllocations(6755744);
      const res = await request(app)
        .post(`/api/v1/allocation/bulk-allocation`)
        .send({
          allocation: -20,
          phase_id: phase.id,
          siteIds: [site.id],
          start_date: new Date(),
        })
        .set(header);
      expect(res.status).toEqual(400);
    });
  });
});
