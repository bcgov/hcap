/**
 * Tests for route /api/v1/milestone-report
 * Test Standalone execution: npm run test:debug milestone-report.e2e.test
 */
import request from 'supertest';
import { app } from '../server';
import { startDB, closeDB } from './util/db';
import { getKeycloakToken, ministryOfHealth, healthAuthority } from './util/keycloak';

describe('api-e2e test for route /api/v1/milestone-report', () => {
  let server;
  beforeAll(async () => {
    await startDB();
    server = app.listen();
  });

  afterAll(async () => {
    await closeDB();
    await server.close();
  });

  it('should get report for MOH', async () => {
    const header = await getKeycloakToken(ministryOfHealth);
    const res = await request(app).get('/api/v1/milestone-report').set(header);
    expect(res.status).toEqual(200);
    expect(res.body?.data).toBeDefined();
  });

  it('should not get report for HA', async () => {
    const header = await getKeycloakToken(healthAuthority);
    const res = await request(app).get('/api/v1/milestone-report').set(header);
    expect(res.status).toEqual(403);
  });

  it('should get hired report for MOH', async () => {
    const header = await getKeycloakToken(ministryOfHealth);
    const res = await request(app).get('/api/v1/milestone-report/csv/hired').set(header);
    expect(res.status).toEqual(200);
  });

  it('should get fail to get hired report without region as HA', async () => {
    const header = await getKeycloakToken(healthAuthority);
    const res = await request(app).get('/api/v1/milestone-report/csv/hired').set(header);
    expect(res.status).toEqual(403);
  });

  it('should get return of service milestone report for MOH', async () => {
    const header = await getKeycloakToken(ministryOfHealth);
    const res = await request(app).get('/api/v1/milestone-report/csv/ros').set(header);
    expect(res.status).toEqual(200);
  });

  it('should fail to get return of service milestone report without region for HA', async () => {
    const header = await getKeycloakToken(healthAuthority);
    const res = await request(app).get('/api/v1/milestone-report/csv/ros').set(header);
    expect(res.status).toEqual(403);
  });

  it('should fail to get return of service milestone report with wrong region for HA', async () => {
    const header = await getKeycloakToken(healthAuthority);
    const res = await request(app).get('/api/v1/milestone-report/csv/ros/Interior').set(header);
    expect(res.status).toEqual(403);
  });

  it('should fail to get hired report with wrong region for HA', async () => {
    const header = await getKeycloakToken(healthAuthority);
    const res = await request(app).get('/api/v1/milestone-report/csv/hired/Interior').set(header);
    expect(res.status).toEqual(403);
  });

  it('should get return of service milestone report with region for HA', async () => {
    const header = await getKeycloakToken(healthAuthority);
    const res = await request(app).get('/api/v1/milestone-report/csv/ros/Fraser').set(header);
    expect(res.status).toEqual(200);
  });

  it('should get hired report with region for HA', async () => {
    const header = await getKeycloakToken(healthAuthority);
    const res = await request(app).get('/api/v1/milestone-report/csv/hired/Fraser').set(header);
    expect(res.status).toEqual(200);
  });
});
