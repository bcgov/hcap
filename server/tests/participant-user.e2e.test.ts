/**
 * Tests for route /api/v1/participant-user/*
 * Test Standalone execution: npm run test:debug participant.landing.e2e.test
 */
import request from 'supertest';
import { app } from '../server';

import { startDB, closeDB } from './util/db';
import { getKeycloakToken, participant } from './util/keycloak';

describe('api e2e tests for /participant-user', () => {
  let server;
  let testParticipant;
  const form = {
    eligibility: true,
    firstName: 'John',
    lastName: 'Smith',
    phoneNumber: '1234567890',
    emailAddress: 'cristiano.ronaldo@hcap.club',
    postalCode: 'V1V 1V1',
    preferredLocation: ['Fraser'],
    reasonForFindingOut: ['Friend(s) or family'],
    consent: true,
  };
  beforeAll(async () => {
    await startDB();
    server = app.listen();
  });

  afterAll(async () => {
    await closeDB();
    await server.close();
  });

  // TODO: Re-add these tests when a participant user is added to keycloak in the pipeline
  describe('GET /participants', () => {
    it('should participants - success', async () => {
      const header = await getKeycloakToken(participant);
      const res = await request(app).get('/api/v1/participant-user/participants').set(header);
      expect(res.status).toEqual(200);
    });

    it('should get participant data with success', async () => {
      const header = await getKeycloakToken(participant);
      const participantRes = await request.agent(app).post('/api/v1/participants').send(form);
      testParticipant = participantRes.body;
      const res = await request(app).get('/api/v1/participant-user/participants').set(header);
      expect(res.status).toEqual(200);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  describe('GET /participant/:id', () => {
    it('should get participant by id', async () => {
      const header = await getKeycloakToken(participant);
      const res = await request(app)
        .get(`/api/v1/participant-user/participant/${testParticipant.id}`)
        .set(header);
      expect(res.status).toEqual(200);
      expect(res.body[0].id).toEqual(testParticipant.id);
    });
  });

  describe('PATCH /participant/:id', () => {
    it('should update participant by id', async () => {
      const header = await getKeycloakToken(participant);
      const res = await request(app)
        .patch(`/api/v1/participant-user/participant/${testParticipant.id}`)
        .send({ isIndigenous: false })
        .set(header);
      expect(res.status).toEqual(200);
    });

    it('should fail to update participant by id due to validation errors', async () => {
      const header = await getKeycloakToken(participant);
      const res = await request(app)
        .patch(`/api/v1/participant-user/participant/${testParticipant.id}`)
        .send({ phoneNumber: '555859594' })
        .set(header);
      expect(res.status).toEqual(400);
    });
  });

  describe('PATCH /participant/batch', () => {
    it('should update participant', async () => {
      const header = await getKeycloakToken(participant);
      const res = await request(app)
        .patch(`/api/v1/participant-user/participant/batch`)
        .send(JSON.stringify({ isIndigenous: true, indigenousIdentities: 'inuit' }))
        .set(header);
      expect(res.status).toEqual(200);
    });
  });

  describe('POST /participant/:id/withdraw', () => {
    it('should withdraw a participant', async () => {
      const header = await getKeycloakToken(participant);
      const res = await request(app)
        .post(`/api/v1/participant-user/participant/${testParticipant.id}/withdraw`)
        .send({
          confirmed: true,
        })
        .set(header);
      expect(res.status).toEqual(200);
    });
  });

  describe('POST /participant/:id/reconfirm_interest', () => {
    it('should reconfirm interest for a participant', async () => {
      const header = await getKeycloakToken(participant);
      const res = await request(app)
        .post(`/api/v1/participant-user/participant/${testParticipant.id}/reconfirm_interest`)
        .set(header);
      expect(res.status).toEqual(201);
    });

    it('should fail to reconfirm interest for a participant - invalid id', async () => {
      const header = await getKeycloakToken(participant);
      const res = await request(app)
        .post(`/api/v1/participant-user/participant/57485/reconfirm_interest`)
        .set(header);
      expect(res.status).toEqual(401);
    });
  });

  describe('POST /withdraw', () => {
    it('should withdraw a participant', async () => {
      const header = await getKeycloakToken(participant);
      const res = await request(app).post('/api/v1/participant-user/withdraw').set(header);
      expect(res.status).toEqual(204);
    });

    it('should withdraw a participant with verification', async () => {
      const header = await getKeycloakToken(participant);
      const res = await request(app).get('/api/v1/participant-user/participants').set(header);
      expect(res.body[0].interested).toEqual('withdrawn');
    });
  });
});
