// Test execution code: npm run test:debug participant.e2e.test.js
import request from 'supertest';
import { app } from '../server';

import { startDB, closeDB } from './util/db';
import {
  getKeycloakToken,
  healthAuthority,
  ministryOfHealth,
  employer,
  superuser,
} from './util/keycloak';
import { makeTestParticipant } from './util/integrationTestData';

describe('e2e tests for /participant route', () => {
  let server;
  beforeAll(async () => {
    await startDB();
    server = app.listen();
  });

  afterAll(async () => {
    await server.close();
    await closeDB();
  });

  describe('GET /participants', () => {
    it('should return participants for MoH', async () => {
      const header = await getKeycloakToken(ministryOfHealth);
      const res = await request(app).get(`/api/v1/participants`).set(header);

      expect(res.status).toEqual(200);
    });

    it('should return participants for HA', async () => {
      const header = await getKeycloakToken(healthAuthority);
      const res = await request(app).get(`/api/v1/participants`).set(header);

      expect(res.status).toEqual(200);
    });

    it('should return participants for employer', async () => {
      const header = await getKeycloakToken(employer);
      const res = await request(app).get(`/api/v1/participants`).set(header);

      expect(res.status).toEqual(200);
    });
  });

  describe('PATCH /', () => {
    it('should update participant data', async () => {
      const p = await makeTestParticipant({
        emailAddress: 'test.e2e.participant.patch@hcap.com',
      });
      const header = await getKeycloakToken(ministryOfHealth);
      const res = await request(app)
        .patch(`/api/v1/participant`)
        .send({
          firstName: 'Tom',
          lastName: 'Smith',
          phoneNumber: '6859600596',
          interested: true,
          emailAddress: 'patch.participant@hcap.com',
          postalCode: 'V1V3E4',
          history: [
            {
              timestamp: new Date(),
              changes: [],
            },
          ],
          id: p.id,
        })
        .set(header);
      expect(res.status).toEqual(200);
    });

    it('should fail to update due to validation error - no unknown', async () => {
      const p = await makeTestParticipant({
        emailAddress: 'test.e2e.participant.patch-1@hcap.com',
      });
      const header = await getKeycloakToken(ministryOfHealth);
      const res = await request(app)
        .patch(`/api/v1/participant`)
        .send({
          firstName: 'Tom',
          city: 'Vancouver',
          lastName: 'Smith',
          phoneNumber: '6859600596',
          interested: true,
          emailAddress: 'patch.participant@hcap.com',
          postalCode: 'V1V3E4',
          history: [
            {
              timestamp: new Date(),
              changes: [],
            },
          ],
          id: p.id,
        })
        .set(header);
      expect(res.status).toEqual(200);
    });
  });
});
