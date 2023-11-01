// Test execution code: npm run test:debug participant.service.test.js
/* eslint-disable no-restricted-syntax, no-await-in-loop */
import { v4 } from 'uuid';
import _ from 'lodash';
import { startDB, closeDB } from './util/db';
import {
  getParticipants,
  makeParticipant,
  getParticipantByID,
  updateParticipant,
  getParticipantsForUser,
  mapUserWithParticipant,
  withdrawParticipantsByEmail,
} from '../services/participants';
import {
  ParticipantStatus as ps,
  Program,
  participantFieldsForSuper,
  participantFieldsForMoH,
  healthRegions,
  participantFieldsForEmployer,
} from '../constants';

import { setParticipantStatus } from '../services/participant-status';

import { createPostHireStatus } from '../services/post-hire-flow';
import { getReport } from '../services/reporting';
import { evaluateBooleanAnswer, postHireStatuses } from '../validation';
import { saveSingleSite } from '../services/employers';
import { approveUsers, employer, healthAuthority } from './util/keycloak';
import { fakeParticipant } from './util/participant';
import { compareArray } from './util/compare-array';

describe('Participants Service', () => {
  const regions = healthRegions;

  const allParticipants = [...Array(10)].map(() => fakeParticipant());

  beforeAll(async () => {
    await startDB();
    await Promise.all(allParticipants.map(async (participant) => makeParticipant(participant)));
    await approveUsers(employer, healthAuthority);
  });

  afterAll(async () => {
    await closeDB();
  });

  it('Get participants as superuser, receive all successfully', async () => {
    const res = await getParticipants({ isSuperUser: true });

    expect(res.data.length).toBe(allParticipants.length);
    expect(
      res.data
        .map((item) => compareArray(Object.keys(item), participantFieldsForSuper))
        .every((v) => v)
    ).toBeTruthy();
  });

  it('Set participant status with different employers, fetch participant with status', async () => {
    const employerAId = 1;
    const employerBId = 2;

    const openParticipants = await getParticipants(
      { isEmployer: true, id: employerAId, regions },
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      [ps.OPEN]
    );

    await setParticipantStatus(employerAId, openParticipants.data[0].id, ps.PROSPECTING);
    await setParticipantStatus(employerAId, openParticipants.data[0].id, ps.INTERVIEWING);
    await setParticipantStatus(employerAId, openParticipants.data[0].id, ps.OFFER_MADE);

    await setParticipantStatus(employerBId, openParticipants.data[0].id, ps.PROSPECTING);

    const participantsA = await getParticipants(
      { isEmployer: true, id: employerAId, regions },
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      [ps.OFFER_MADE]
    );
    expect(participantsA.data[0].statusInfos[0].employerId).toEqual(employerAId);

    const participantsB = await getParticipants(
      { isEmployer: true, id: employerBId, regions },
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      [ps.PROSPECTING]
    );
    expect(participantsB.data[0].statusInfos[0].employerId).toEqual(employerBId);
  });

  it('Get participants as MoH, receive successfully', async () => {
    const res = await getParticipants({
      isMoH: true,
    });

    const received = res.data.map((item) => Object.keys(item).sort()); // NOSONAR
    const expected = allParticipants.map(() => participantFieldsForMoH.sort()); // NOSONAR
    expect(received).toEqual(expected);
  });

  it('Get participants as HA, receive successfully', async () => {
    const res = await getParticipants({
      isMoH: false,
      isSuperUser: false,
      isHA: true,
      regions,
      roles: ['region_fraser'],
    });

    const mapRawToEmployerColumns = (a) => {
      const employerColumns = [
        // Fields expected to be returned to employers
        'program',
        'educationalRequirements',
        'firstName',
        'lastName',
        'postalCodeFsa',
        'indigenous',
        'driverLicense',
        'experienceWithMentalHealthOrSubstanceUse',
        'preferredLocation',
        'currentOrMostRecentIndustry',
        'roleInvolvesMentalHealthOrSubstanceUse',
        'nonHCAP',
        'statusInfo',
        'userUpdatedAt',
        'progressStats',
        'postHireStatuses',
        'rosStatuses',
      ];
      return a.map((i) =>
        Object.keys(i)
          .filter((k) => employerColumns.includes(k))
          .reduce((o, k) => ({ ...o, [k]: i[k] }), {
            nonHCAP: undefined,
            postHireStatuses: [],
            rosStatuses: [],
          })
      );
    };

    let expected = mapRawToEmployerColumns(
      allParticipants.filter((i) => evaluateBooleanAnswer(i.interested))
    );
    res.data.forEach((row) => {
      expect(Object.keys(row).sort()).toEqual(participantFieldsForEmployer.sort()); // NOSONAR
    });
    const received = _.uniq(res.data.map((row) => row.firstName)).sort(); // NOSONAR
    expected = _.uniq(expected.map((row) => row.firstName)).sort(); // NOSONAR
    expect(received).toEqual(expected);
  });

  it('confirms that reporting works properly', async () => {
    const employerAId = 1;

    const participant = {
      maximusId: 648690,
      lastName: 'Extra',
      firstName: 'Eddy',
      postalCode: 'V1V2V3',
      postalCodeFsa: 'V1V',
      phoneNumber: '2502223333',
      emailAddress: 'eddy@example.com',
      interested: 'yes',
      nonHCAP: 'yes',
      crcClear: 'yes',
      preferredLocation: 'Fraser',
      program: 'HCA',
    };

    await makeParticipant(participant);
    const participants = await getParticipants({ isMoH: true });
    await setParticipantStatus(employerAId, participants.data[0].id, ps.PROSPECTING);
    await setParticipantStatus(employerAId, participants.data[0].id, ps.REJECTED, {
      final_status: 'not responsive',
    });
  });

  it('Status change happy path', async () => {
    const employerAId = 1;
    const participants = await getParticipants(
      { isEmployer: true, id: employerAId, regions },
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      [ps.OPEN]
    );
    const participantId = participants.data[0].id;

    // Engage, reject
    expect((await setParticipantStatus(employerAId, participantId, ps.PROSPECTING)).status).toEqual(
      ps.PROSPECTING
    );
    expect(
      (
        await setParticipantStatus(employerAId, participantId, ps.REJECTED, {
          final_status: 'not responsive',
          previous: ps.PROSPECTING,
        })
      ).status
    ).toEqual(ps.REJECTED);

    // Engage, withdraw
    expect((await setParticipantStatus(employerAId, participantId, ps.PROSPECTING)).status).toEqual(
      ps.PROSPECTING
    );
    expect(
      (
        await setParticipantStatus(employerAId, participantId, ps.REJECTED, {
          final_status: 'withdrawn',
          previous: ps.PROSPECTING,
        })
      ).status
    ).toEqual(ps.REJECTED);

    // Re-engage, interview, reject
    expect((await setParticipantStatus(employerAId, participantId, ps.PROSPECTING)).status).toEqual(
      ps.PROSPECTING
    );
    expect(
      (await setParticipantStatus(employerAId, participantId, ps.INTERVIEWING)).status
    ).toEqual(ps.INTERVIEWING);
    expect(
      (
        await setParticipantStatus(employerAId, participantId, ps.REJECTED, {
          final_status: 'not qualified',
          previous: ps.INTERVIEWING,
        })
      ).status
    ).toEqual(ps.REJECTED);

    // Re-engage. offer made, reject
    expect((await setParticipantStatus(employerAId, participantId, ps.PROSPECTING)).status).toEqual(
      ps.PROSPECTING
    );
    expect(
      (await setParticipantStatus(employerAId, participantId, ps.INTERVIEWING)).status
    ).toEqual(ps.INTERVIEWING);
    expect((await setParticipantStatus(employerAId, participantId, ps.OFFER_MADE)).status).toEqual(
      ps.OFFER_MADE
    );
    expect(
      (
        await setParticipantStatus(employerAId, participantId, ps.REJECTED, {
          final_status: 'position filled',
          previous: ps.OFFER_MADE,
        })
      ).status
    ).toEqual(ps.REJECTED);

    // Re-engage, hire
    expect((await setParticipantStatus(employerAId, participantId, ps.PROSPECTING)).status).toEqual(
      ps.PROSPECTING
    );
    expect(
      (await setParticipantStatus(employerAId, participantId, ps.INTERVIEWING)).status
    ).toEqual(ps.INTERVIEWING);
    expect((await setParticipantStatus(employerAId, participantId, ps.OFFER_MADE)).status).toEqual(
      ps.OFFER_MADE
    );
    expect((await setParticipantStatus(employerAId, participantId, ps.HIRED)).status).toEqual(
      ps.HIRED
    );
  });

  it('Employer A hires participant X then employer B cannot hire participant X', async () => {
    const employerAId = 1;
    const employerBId = 2;

    const participants = await getParticipants(
      { isEmployer: true, id: employerAId, regions },
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      [ps.OPEN]
    );

    const hiredParticipantId = participants.data[0].id;

    await setParticipantStatus(employerAId, hiredParticipantId, ps.PROSPECTING);
    await setParticipantStatus(employerAId, hiredParticipantId, ps.INTERVIEWING);
    await setParticipantStatus(employerAId, hiredParticipantId, ps.OFFER_MADE);
    await setParticipantStatus(employerAId, hiredParticipantId, ps.HIRED);

    const result = await setParticipantStatus(employerBId, hiredParticipantId, ps.HIRED);

    expect(result.status).toEqual('already_hired');
  });

  it('Status change does not follow transitions: open > prospecting > interviewing > offer_made > hired, receive invalid_status_transition', async () => {
    const employerAId = 1;

    const participants = await getParticipants(
      { isEmployer: true, id: employerAId, regions },
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      [ps.OPEN]
    );

    const participantId = participants.data[0].id;

    // Cannot skip a status
    expect(
      (await setParticipantStatus(employerAId, participantId, ps.INTERVIEWING)).status
    ).toEqual('invalid_status_transition');
    expect((await setParticipantStatus(employerAId, participantId, ps.OFFER_MADE)).status).toEqual(
      'invalid_status_transition'
    );
    expect((await setParticipantStatus(employerAId, participantId, ps.HIRED)).status).toEqual(
      'invalid_status_transition'
    );
    expect(
      (await setParticipantStatus(employerAId, participantId, ps.INTERVIEWING)).status
    ).toEqual('invalid_status_transition');

    // Cannot go backwards
    await setParticipantStatus(employerAId, participantId, ps.PROSPECTING);
    expect((await setParticipantStatus(employerAId, participantId, ps.OPEN)).status).toEqual(
      'invalid_status_transition'
    );
    await setParticipantStatus(employerAId, participantId, ps.INTERVIEWING);
    expect((await setParticipantStatus(employerAId, participantId, ps.PROSPECTING)).status).toEqual(
      'invalid_status_transition'
    );
    expect((await setParticipantStatus(employerAId, participantId, ps.OPEN)).status).toEqual(
      'invalid_status_transition'
    );
    await setParticipantStatus(employerAId, participantId, ps.OFFER_MADE);
    expect(
      (await setParticipantStatus(employerAId, participantId, ps.INTERVIEWING)).status
    ).toEqual('invalid_status_transition');
    expect((await setParticipantStatus(employerAId, participantId, ps.PROSPECTING)).status).toEqual(
      'invalid_status_transition'
    );
    expect((await setParticipantStatus(employerAId, participantId, ps.OPEN)).status).toEqual(
      'invalid_status_transition'
    );

    // Cannot hire and re-engage
    await setParticipantStatus(employerAId, participantId, ps.HIRED);
    expect((await setParticipantStatus(employerAId, participantId, ps.OPEN)).status).toEqual(
      'already_hired'
    );
    expect((await setParticipantStatus(employerAId, participantId, ps.PROSPECTING)).status).toEqual(
      'already_hired'
    );
    expect(
      (await setParticipantStatus(employerAId, participantId, ps.INTERVIEWING)).status
    ).toEqual('already_hired');
    expect((await setParticipantStatus(employerAId, participantId, ps.OFFER_MADE)).status).toEqual(
      'already_hired'
    );
    expect((await setParticipantStatus(employerAId, participantId, ps.HIRED)).status).toEqual(
      'already_hired'
    );
  });

  it('Two Employers engage one participant and the inProgress number increases by one', async () => {
    const employerAId = 1;
    const employerBId = 2;

    const participants = await getParticipants(
      { isEmployer: true, id: employerAId, regions },
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      [ps.OPEN]
    );

    const selectParticipantId = participants.data[0].id;

    const firstReport = await getReport();

    await setParticipantStatus(employerAId, selectParticipantId, ps.PROSPECTING);
    await setParticipantStatus(employerBId, selectParticipantId, ps.PROSPECTING);

    const secondReport = await getReport();

    expect(secondReport.inProgress).toEqual(firstReport.inProgress + 1);
  });

  it('See unavailable participant, acknowledge as rejected, then receive 0 unavailable participants', async () => {
    const employerAId = 1;
    const employerBId = 2;

    const participantsB = await getParticipants(
      { isEmployer: true, id: employerBId, regions, sites: [2] },
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      [ps.OPEN]
    );

    const selectParticipantId = participantsB.data[0].id;

    await setParticipantStatus(employerAId, selectParticipantId, ps.PROSPECTING);
    await setParticipantStatus(employerBId, selectParticipantId, ps.PROSPECTING);
    await setParticipantStatus(employerBId, selectParticipantId, ps.INTERVIEWING);
    await setParticipantStatus(employerBId, selectParticipantId, ps.OFFER_MADE);
    await setParticipantStatus(employerBId, selectParticipantId, ps.HIRED, {
      site: 2,
    });

    const unavailableParticipantsA = await getParticipants(
      { isEmployer: true, id: employerAId, regions, sites: [1] },
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      [ps.PROSPECTING, ps.INTERVIEWING, ps.OFFER_MADE, ps.UNAVAILABLE]
    );

    let participant = unavailableParticipantsA.data.find((p) => p.id === selectParticipantId);
    expect(participant.statusInfos[0].status).toEqual(ps.PROSPECTING);
    expect(participant.statusInfos[1].status).toEqual(ps.ALREADY_HIRED);

    await setParticipantStatus(employerAId, selectParticipantId, ps.REJECTED, {
      final_status: 'hired by other',
      previous: ps.PROSPECTING,
    });

    const rejectedParticipantsA = await getParticipants(
      { isEmployer: true, id: employerAId, regions, sites: [] },
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      [ps.REJECTED]
    );

    participant = rejectedParticipantsA.data.find((p) => p.id === selectParticipantId);
    expect(participant.statusInfos[0].status).toEqual(ps.REJECTED);
    expect(participant.statusInfos[0].data.final_status).toEqual('hired by other');
    expect(participant.statusInfos[0].data.previous).toEqual(ps.PROSPECTING);
    expect(participant.statusInfos[1].status).toEqual(ps.ALREADY_HIRED);

    const unavailableParticipantsAafter = await getParticipants(
      { isEmployer: true, id: employerAId, regions, sites: [] },
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      [ps.PROSPECTING, ps.INTERVIEWING, ps.OFFER_MADE, ps.UNAVAILABLE]
    );

    participant = unavailableParticipantsAafter.data.find((p) => p.id === selectParticipantId);
    expect(participant).toBeUndefined();
  });

  it('Checks MoH status versus multiple employer engagement', async () => {
    await closeDB();
    await startDB();
    await approveUsers(employer, healthAuthority);
    const employerAId = 1;
    const employerBId = 2;

    const participant1 = fakeParticipant();
    const participant2 = fakeParticipant({ crcClear: 'no' });
    const participant3 = fakeParticipant({ interested: 'no' });

    await makeParticipant(participant1);
    await makeParticipant(participant2);
    await makeParticipant(participant3);

    let participants = await getParticipants({ isMoH: true });
    expect(participants.data[0].statusInfo).toEqual('Available');
    expect(participants.data[1].statusInfo).toEqual('Available');
    expect(participants.data[2].statusInfo).toEqual('Withdrawn');

    await setParticipantStatus(employerAId, participants.data[0].id, ps.PROSPECTING);

    participants = await getParticipants({ isMoH: true });
    expect(participants.data[0].statusInfo).toEqual('In Progress');

    await setParticipantStatus(employerBId, participants.data[0].id, ps.PROSPECTING);
    await setParticipantStatus(employerBId, participants.data[0].id, ps.INTERVIEWING);
    await setParticipantStatus(employerBId, participants.data[0].id, ps.OFFER_MADE);

    participants = await getParticipants({ isMoH: true });
    expect(participants.data[0].statusInfo).toEqual('In Progress (2)');

    await setParticipantStatus(employerBId, participants.data[0].id, ps.HIRED);

    participants = await getParticipants({ isMoH: true });
    expect(participants.data[0].statusInfo).toEqual('Hired');
  });

  it('checks the status of an entry made through the new-hired-participant endpoint', async () => {
    await closeDB();
    await startDB();
    await approveUsers(employer);
    const employerAId = 1;

    const participant1 = fakeParticipant({ preferredLocation: 'Fraser' });

    const response = await makeParticipant(participant1);
    await setParticipantStatus(employerAId, response.id, ps.PROSPECTING);
    await setParticipantStatus(employerAId, response.id, ps.INTERVIEWING, {
      contacted_at: participant1.contactedDate,
    });
    await setParticipantStatus(employerAId, response.id, ps.OFFER_MADE);
    await setParticipantStatus(employerAId, response.id, ps.HIRED, {
      program: Program.HCA,
      contactedDate: '09/09/2020',
      hiredDate: '10/10/2020',
      startDate: '11/11/2020',
      site: 2,
    });

    const participants = await getParticipants(
      { isEmployer: true, id: employerAId, regions, sites: [2] },
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      [ps.HIRED]
    );
    expect(participants.data[0].statusInfos[0].status).toEqual(ps.HIRED);

    // Multi org support
    const employerBId = 2;
    const participantsForEmployerB = await getParticipants(
      { isEmployer: true, id: employerBId, regions, sites: [2] },
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      [ps.HIRED]
    );
    expect(participantsForEmployerB.data[0].statusInfos[0].status).toEqual(ps.HIRED);
  });

  it("Tests functionality for updating a user's information", async () => {
    await closeDB();
    await startDB();
    const participantData = fakeParticipant({ preferredLocation: 'Fraser' });

    const patchableFields = [
      'firstName',
      'lastName',
      'emailAddress',
      'phoneNumber',
      'interest',
      'history',
      'id',
    ];

    await makeParticipant(participantData);
    const participants = await getParticipants({ isMoH: true });
    const participant = {
      id: participants.data[0].id,
      ...participantData,
    };

    const reduceParticipant: {
      firstName?: string;
      lastName?: string;
      emailAddress?: string;
      phoneNumber?: string;
      interest?: string;
      history?; // Could use better typing
      id?: string;
    } = Object.keys(participant).reduce(
      (o, k) => (patchableFields.includes(k) ? { ...o, [k]: participant[k] } : o),
      {}
    );

    const query = await getParticipantByID(reduceParticipant?.id);
    expect(query[0].firstName).toEqual(reduceParticipant.firstName);
    reduceParticipant.history = [
      { timestamp: new Date(), changes: [{ field: 'firstName', from: 'Eduardo', to: 'Eddy' }] },
    ];
    await updateParticipant(reduceParticipant);
    const query2 = await getParticipantByID(reduceParticipant?.id);
    expect(query2[0].firstName).toEqual('Eddy');
    expect(query2[0].history.length).toEqual(1);
  });

  it('checks the site name of a hired participant', async () => {
    await closeDB();
    await startDB();
    await approveUsers(employer);
    const employerAId = 1;

    const participant1 = fakeParticipant({ preferredLocation: 'Fraser' });

    await saveSingleSite({
      siteId: 2,
      siteName: 'test',
      isRHO: false,
      postalCode: 'A1A 1A1',
      healthAuthority: 'Fraser',
    });

    const response = await makeParticipant(participant1);
    await setParticipantStatus(employerAId, response.id, ps.PROSPECTING);
    await setParticipantStatus(employerAId, response.id, ps.INTERVIEWING, {
      contacted_at: participant1.contactedDate,
    });
    await setParticipantStatus(employerAId, response.id, ps.OFFER_MADE);
    await setParticipantStatus(employerAId, response.id, ps.HIRED, {
      program: Program.HCA,
      contactedDate: '09/09/2020',
      hiredDate: '10/10/2020',
      startDate: '11/11/2020',
      site: 2,
    });

    const participants = await getParticipants(
      { isEmployer: true, id: employerAId, regions, sites: [2] },
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      [ps.HIRED]
    );
    expect(participants.data[0].statusInfos[0].data.siteName).toEqual('test');
  });

  it('test participant user mapper methods', async () => {
    const participant1 = fakeParticipant();

    const participant2 = fakeParticipant({ emailAddress: participant1.emailAddress });

    await makeParticipant(participant1);
    await makeParticipant(participant2);
    const userId = v4();

    const result2 = await getParticipantsForUser(userId, participant1.emailAddress);
    expect(result2.length).toEqual(2);
    expect(result2[0].emailAddress).toEqual(participant1.emailAddress);

    const participant3 = fakeParticipant({ emailAddress: participant1.emailAddress });
    await makeParticipant(participant3);

    const result3 = await getParticipantsForUser(userId, participant1.emailAddress);
    expect(result3.length).toEqual(3);
  });

  it('should map participant with user', async () => {
    const participant1 = fakeParticipant();

    const resp = await makeParticipant(participant1);
    const userId = v4();

    await mapUserWithParticipant(userId, resp.id);
    const result = await getParticipantsForUser(userId, participant1.emailAddress);
    expect(result[0].emailAddress).toEqual(participant1.emailAddress);
  });

  it('Should withdraw multiple participants', async () => {
    // Setup
    const participant = fakeParticipant();

    const resp1 = await makeParticipant(participant);
    const resp2 = await makeParticipant(
      fakeParticipant({ emailAddress: participant.emailAddress })
    );

    const userId = v4();

    await mapUserWithParticipant(userId, resp1.id);
    await mapUserWithParticipant(userId, resp2.id);

    await withdrawParticipantsByEmail(userId, participant.emailAddress);
    const finalParticipants = await getParticipantsForUser(userId, participant.emailAddress);
    finalParticipants.forEach(({ interested }) => expect(interested).toEqual('withdrawn'));
  });
  it('Getting participants should return hired data.', async () => {
    const participant = fakeParticipant();
    const resp = await makeParticipant(participant);

    const userId = v4();
    const employerId = 1;

    await mapUserWithParticipant(userId, resp.id);
    // Hire the user
    await setParticipantStatus(employerId, resp.id, ps.PROSPECTING);
    await setParticipantStatus(employerId, resp.id, ps.INTERVIEWING);
    await setParticipantStatus(employerId, resp.id, ps.OFFER_MADE);
    await setParticipantStatus(employerId, resp.id, ps.HIRED);
    const finalParticipants = await getParticipantsForUser(userId, participant.emailAddress);
    expect(Boolean(finalParticipants.find(({ hired }) => hired.length > 0))).toEqual(true);
  });

  it('should returns post hire statuses', async () => {
    await closeDB();
    await startDB();
    await approveUsers(employer);
    const employerAId = 1;

    const participant1 = fakeParticipant({ preferredLocation: 'Fraser' });

    const response = await makeParticipant(participant1);

    // Set Participant Status post hire status
    await createPostHireStatus({
      participantId: response.id,
      status: postHireStatuses.postSecondaryEducationCompleted,
      data: {},
    });

    const participants = await getParticipants(
      { isEmployer: true, id: employerAId, regions },
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      [ps.OPEN]
    );
    expect(participants.data[0].postHireStatuses.length).toEqual(1);
  });
});
