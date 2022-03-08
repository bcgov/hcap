/* eslint-disable no-restricted-syntax, no-await-in-loop */
// Test execution code: npm run test:debug return-of-service.e2e.test.js
const request = require('supertest');
const app = require('../server');
const { startDB, closeDB } = require('./util/db');
const { getKeycloakToken, healthAuthority } = require('./util/keycloak');
const { rosData, participantData, siteData } = require('./util/testData');
const { createTestParticipantStatus } = require('./util/integrationTestData');

describe('api e2e tests for /ros routes', () => {
  let server;
  let testParticipant;
  let testSite;
  beforeAll(async () => {
    await startDB();
    server = app.listen();
    const { participant, site } = await createTestParticipantStatus({
      participantData: participantData({ emailAddress: 'test.e2e.ros@hcap.io' }),
      siteData: siteData({
        siteId: 7,
        siteName: 'Test E2E ROS Service Global',
        operatorEmail: 'test.e2e.ros.ops@hcap.io',
      }),
    });
    testParticipant = participant;
    testSite = site;
  });

  afterAll(async () => {
    await closeDB();
    await server.close();
  });

  it('should create ros status', async () => {
    const header = await getKeycloakToken(healthAuthority);
    const rosDataObj = rosData({});
    const res = await request(app)
      .post(`/api/v1/ros/participant/${testParticipant.id}`)
      .send({
        data: rosDataObj,
      })
      .set(header);
    expect(res.status).toEqual(201);
    expect(res.body).toHaveProperty('id');
  });

  it('should get ros status', async () => {
    const header = await getKeycloakToken(healthAuthority);
    const res = await request(app).get(`/api/v1/ros/participant/${testParticipant.id}`).set(header);
    expect(res.status).toEqual(200);
    const statuses = res.body || [];
    expect(statuses.length).toBeGreaterThan(0);
    expect(statuses[0]).toHaveProperty('id');
    expect(statuses[0].participant_id).toEqual(testParticipant.id);
    expect(statuses[0].site_id).toEqual(testSite.id);
    expect(statuses[0].data).toBeDefined();
    expect(statuses[0].site).toBeDefined();
    expect(statuses[0].site.id).toEqual(testSite.id);
  });
});
