/* eslint-disable no-restricted-syntax, no-await-in-loop */
// Test execution code: npm run test:debug return-of-service.e2e.test.js
import request from 'supertest';
import { app } from '../server';

import { startDB, closeDB } from './util/db';
import {
  getKeycloakToken,
  healthAuthority,
  employer,
  ministryOfHealth,
  approveUsers,
} from './util/keycloak';
import { rosData, participantData, siteData } from './util/testData';
import { rosPositionType } from '../constants';
import { createTestParticipantStatus, makeTestSite } from './util/integrationTestData';

describe('api e2e tests for /ros routes', () => {
  let server;
  let testParticipant;
  let testSite;
  beforeAll(async () => {
    await startDB();
    server = app.listen();
    await approveUsers(employer, healthAuthority, ministryOfHealth);

    const { participant, site } = await createTestParticipantStatus({
      participantData: participantData({ emailAddress: 'test.e2e.ros@hcap.io' }),
      employerId: 1,
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

  describe('POST /participant/:participantId', () => {
    it('should create ros status for HA', async () => {
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

    it('should create ros status for employer', async () => {
      const header = await getKeycloakToken(employer);
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

    it('should fail to create ros status due to validation errors', async () => {
      const header = await getKeycloakToken(healthAuthority);
      const res = await request(app)
        .post(`/api/v1/ros/participant/${testParticipant.id}`)
        .send({
          data: rosData({ employmentType: null }),
        })
        .set(header);
      expect(res.status).toEqual(400);
    });

    it('should create RoS status with different site', async () => {
      const { participant } = await createTestParticipantStatus({
        participantData: participantData({ emailAddress: 'test.e2e.ros1@hcap.io' }),
        employerId: 1,
        siteData: siteData({
          siteId: 202206022000,
          siteName: 'Test E2E ROS Service Global - 1',
          operatorEmail: 'test.e2e.ros.ops1@hcap.io',
        }),
      });

      const siteOther = await makeTestSite({
        siteId: 202206022001,
        siteName: 'Test E2E ROS Service Global - 2',
        operatorEmail: 'test.e2e.ros.ops2@hcap.io',
      });
      const header = await getKeycloakToken(healthAuthority);
      const res = await request(app)
        .post(`/api/v1/ros/participant/${participant.id}`)
        .send({
          siteId: siteOther.id,
          data: rosData({}),
        })
        .set(header);
      expect(res.status).toEqual(201);
      expect(res.body).toHaveProperty('id');
    });

    it('should fail to create RoS status with different site due to validation errors', async () => {
      const siteOther = await makeTestSite({
        siteId: 2006706702001,
        siteName: 'Test E2E ROS Service Global - 2',
        operatorEmail: 'test.e2e.ros.ops2@hcap.io',
      });
      const header = await getKeycloakToken(healthAuthority);
      const res = await request(app)
        .post(`/api/v1/ros/participant/${testParticipant.id}`)
        .send({
          siteId: siteOther.id,
          data: rosData({ employmentType: null }),
        })
        .set(header);
      expect(res.status).toEqual(400);
    });
  });

  describe('GET /participant/:participantId', () => {
    it('should get ros status as HA', async () => {
      const header = await getKeycloakToken(healthAuthority);
      const res = await request(app)
        .get(`/api/v1/ros/participant/${testParticipant.id}`)
        .set(header);
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

    it('should get ros status as MOH', async () => {
      const header = await getKeycloakToken(ministryOfHealth);
      const res = await request(app)
        .get(`/api/v1/ros/participant/${testParticipant.id}`)
        .set(header);
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

  describe('PATCH /participant/:participantId', () => {
    it('should update ros status for MOH', async () => {
      const header = await getKeycloakToken(ministryOfHealth);
      const rosDataObj = rosData({});
      const res = await request(app)
        .patch(`/api/v1/ros/participant/${testParticipant.id}`)
        .send({
          data: { ...rosDataObj, positionType: rosPositionType.casual },
        })
        .set(header);
      expect(res.status).toEqual(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.data.positionType).toEqual('casual');
    });

    it('should fail to update ros status for HA', async () => {
      const header = await getKeycloakToken(healthAuthority);
      const rosDataObj = rosData({});
      const res = await request(app)
        .patch(`/api/v1/ros/participant/${testParticipant.id}`)
        .send({
          data: { ...rosDataObj, positionType: rosPositionType.casual },
        })
        .set(header);
      expect(res.status).toEqual(403);
    });
  });

  describe('PATCH /participant/:participantId/change-site', () => {
    it('should update ros status with new site for HA', async () => {
      const site = await makeTestSite({
        siteId: 200670543702001,
        siteName: 'Test E2E ROS Service Global - 2',
        operatorEmail: 'test.e2e.ros.ops2@hcap.io',
      });
      const header = await getKeycloakToken(healthAuthority);
      const rosDataObj = rosData({});
      const res = await request(app)
        .patch(`/api/v1/ros/participant/${testParticipant.id}/change-site`)
        .send({
          data: {
            ...rosDataObj,
            site: site.siteId,
            startDate: new Date(),
          },
        })
        .set(header);
      expect(res.status).toEqual(201);
    });

    it('should fail to update ros status with new site for MOH', async () => {
      const site = await makeTestSite({
        siteId: 2006705444302001,
        siteName: 'Test E2E ROS Service Global - 2',
        operatorEmail: 'test.e2e.ros.ops2@hcap.io',
      });
      const header = await getKeycloakToken(ministryOfHealth);
      const rosDataObj = rosData({});
      const res = await request(app)
        .patch(`/api/v1/ros/participant/${testParticipant.id}/change-site`)
        .send({
          data: {
            ...rosDataObj,
            site: site.siteId,
            startDate: new Date(),
          },
        })
        .set(header);
      expect(res.status).toEqual(403);
    });
  });
});
