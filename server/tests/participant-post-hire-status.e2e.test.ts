// Test execution code: npm run test:debug participant-post-hire-status.e2e.test.js

import request from 'supertest';
import { app } from '../server';

import { startDB, closeDB } from './util/db';
import {
  makeTestParticipant,
  makeTestPostHireStatus,
  makeCohortAssignment,
} from './util/integrationTestData';
import { getKeycloakToken, healthAuthority } from './util/keycloak';
import { postHireStatusData } from './util/testData';
import { postHireStatuses } from '../validation';

describe('api e2e test for /post-hire-status', () => {
  let server;
  let testParticipantId;
  let testPSIId;
  let testCohortId;
  beforeAll(async () => {
    await startDB();
    server = app.listen();
    const { participantId, cohortId, psiId } = await makeCohortAssignment({
      email: 'test.post.hire.status@hcap.io',
      psiName: 'Test PSI For Post Hire Status',
      cohortName: 'S22.1',
    });
    testParticipantId = participantId;
    testCohortId = cohortId;
    testPSIId = psiId;
    expect(testParticipantId).toBeTruthy();
    expect(testCohortId).toBeTruthy();
    expect(testPSIId).toBeTruthy();
  });

  afterAll(async () => {
    await closeDB();
    await server.close();
  });

  it('should create new status', async () => {
    const p = await makeTestParticipant({ emailAddress: 'test.e2e.post.hire.create@hcap.io' });
    const { participantId, cohortId, psiId, cohortAssignmentId } = await makeCohortAssignment({
      participantId: p.id,
      psiId: testPSIId,
      cohortName: 'S22.2',
    });
    expect(participantId).toBeTruthy();
    expect(cohortId).toBeTruthy();
    expect(psiId).toBeTruthy();
    expect(cohortAssignmentId).toBeTruthy();
    const testData = {
      participantIds: [p.id],
      status: postHireStatuses.postSecondaryEducationCompleted,
      data: {
        graduationDate: '2020/01/01',
      },
    };
    const header = await getKeycloakToken(healthAuthority);
    const res = await request(app).post('/api/v1/post-hire-status').send(testData).set(header);
    expect(res.status).toEqual(201);
    expect(res.body[0]).toHaveProperty('id');
  });

  it('should return all post hire status for participant', async () => {
    const { participant } = await makeTestPostHireStatus({
      email: 'test.e2e.post.hire.get@hcap.io',
      status: postHireStatuses.postSecondaryEducationCompleted,
    });

    const header = await getKeycloakToken(healthAuthority);
    const res = await request(app)
      .get(`/api/v1/post-hire-status/participant/${participant.id}`)
      .set(header);
    expect(res.status).toEqual(200);
  });

  it('should return 422 for posting status without cohort assignment', async () => {
    const participant = await makeTestParticipant({
      emailAddress: 'test.participant.hire4@hcap.io',
    });
    const body = postHireStatusData({
      participantIds: [participant.id],
      status: postHireStatuses.postSecondaryEducationCompleted,
      graduationDate: '2022/02/01',
    });
    const header = await getKeycloakToken(healthAuthority);
    const res = await request(app).post('/api/v1/post-hire-status').send(body).set(header);
    expect(res.status).toEqual(422);
  });

  it('should return 422 for posting status with incorrect participant Ids', async () => {
    const p = await makeTestParticipant({ emailAddress: 'test.e2e.post.hire.createTwo@hcap.io' });
    const { participantId, cohortId, psiId, cohortAssignmentId } = await makeCohortAssignment({
      participantId: p.id,
      psiId: testPSIId,
      cohortName: 'Test cohort',
    });
    expect(participantId).toBeTruthy();
    expect(cohortId).toBeTruthy();
    expect(psiId).toBeTruthy();
    expect(cohortAssignmentId).toBeTruthy();
    // mock participant id's that should not exist
    const testData = {
      participantIds: [p.id, 30042, 41024, 14023],
      status: postHireStatuses.postSecondaryEducationCompleted,
      data: {
        graduationDate: '2022/02/01',
      },
    };
    const header = await getKeycloakToken(healthAuthority);
    const res = await request(app).post('/api/v1/post-hire-status').send(testData).set(header);
    expect(res.status).toEqual(422);
  });

  it('should return 400 for posting status with invalid data - incorrect status', async () => {
    const p = await makeTestParticipant({ emailAddress: 'incorrect_status@hcap.io' });
    const { participantId } = await makeCohortAssignment({
      participantId: p.id,
      psiId: testPSIId,
      cohortName: 'Test cohort',
    });
    const testData = {
      participantIds: [participantId],
      status: 'graduation_completed',
      data: {
        graduationDate: '2022/02/01',
      },
    };
    const header = await getKeycloakToken(healthAuthority);
    const res = await request(app).post('/api/v1/post-hire-status').send(testData).set(header);
    expect(res.status).toEqual(400);
  });

  it('should return 400 for posting status with invalid data - incorrect date for status', async () => {
    const p = await makeTestParticipant({ emailAddress: 'invalid_date_field@hcap.io' });
    const { participantId } = await makeCohortAssignment({
      participantId: p.id,
      psiId: testPSIId,
      cohortName: 'Test cohort',
    });
    const testData = {
      participantIds: [participantId],
      status: postHireStatuses.postSecondaryEducationCompleted,
      data: {
        unsuccessfulCohortDate: '2022/02/01',
      },
    };
    const header = await getKeycloakToken(healthAuthority);
    const res = await request(app).post('/api/v1/post-hire-status').send(testData).set(header);
    expect(res.status).toEqual(400);
  });

  it('should return 400 for posting status with invalid data - unknown field in payload', async () => {
    const p = await makeTestParticipant({ emailAddress: 'unknown_field_in_payload@hcap.io' });
    const { participantId } = await makeCohortAssignment({
      participantId: p.id,
      psiId: testPSIId,
      cohortName: 'Test cohort',
    });
    const testData = {
      participantIds: [participantId],
      graduationDate: '2022/02/01',
      status: postHireStatuses.postSecondaryEducationCompleted,
      data: {
        graduationDate: '2022/02/01',
      },
    };
    const header = await getKeycloakToken(healthAuthority);
    const res = await request(app).post('/api/v1/post-hire-status').send(testData).set(header);
    expect(res.status).toEqual(400);
  });
});
