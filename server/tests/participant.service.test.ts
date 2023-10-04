// Test execution code: npm run test:debug participant.service.test.js
/* eslint-disable no-restricted-syntax, no-await-in-loop */
import { v4 } from 'uuid';
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
import { ParticipantStatus as ps } from '../constants';

import { setParticipantStatus } from '../services/participant-status';

import { createPostHireStatus } from '../services/post-hire-flow';
import { getReport } from '../services/reporting';
import { evaluateBooleanAnswer, postHireStatuses } from '../validation';
import { saveSingleSite } from '../services/employers';
import { approveUsers, employer, healthAuthority } from './util/keycloak';
import { participantFields } from '../constants/participant-fields';

describe('Participants Service', () => {
  const regions = ['Fraser', 'Interior', 'Northern', 'Vancouver Coastal', 'Vancouver Island'];

  const allParticipants = [
    {
      callbackStatus: false,
      nonHCAP: 'yes',
      crcClear: 'yes',
      lastName: 'Alex',
      firstName: 'Alliteration',
      maximusId: 6488690,
      interested: 'yes',
      postalCode: 'V1V2V3',
      phoneNumber: '2502223333',
      emailAddress: 'alli@example.com',
      postalCodeFsa: 'V1V',
      preferredLocation: 'Fraser',
    },
    {
      callbackStatus: false,
      crcClear: 'yes',
      lastName: 'Bob',
      firstName: 'Burger',
      maximusId: 6488691,
      interested: 'yes',
      postalCode: 'X1X1X1',
      phoneNumber: '7781234567',
      emailAddress: 'bob.burger@test.com',
      postalCodeFsa: 'X1X',
      preferredLocation: 'Interior',
    },
    {
      callbackStatus: false,
      crcClear: 'yes',
      lastName: 'Cindy',
      firstName: 'Callback',
      maximusId: 6488692,
      postalCode: 'X2X2X2',
      phoneNumber: '7780987654',
      emailAddress: 'cindy@example.ca',
      postalCodeFsa: 'X2X',
      preferredLocation: 'Northern',
      program: 'HCA',
    },
    {
      callbackStatus: false,
      lastName: 'Doug',
      firstName: 'Douglas',
      maximusId: 6488693,
      interested: 'yes',
      postalCode: 'C9C8C7',
      phoneNumber: '6051234567',
      emailAddress: 'doug@test.bc.gov',
      postalCodeFsa: 'C9C',
      preferredLocation: 'Vancouver Coastal;Vancouver Island',
      program: 'HCA',
    },
    {
      callbackStatus: false,
      nonHCAP: 'yes',
      crcClear: 'no',
      lastName: 'Emily',
      firstName: 'Everready',
      maximusId: 6488694,
      interested: 'yes',
      postalCode: 'C9C8C7',
      phoneNumber: '6050987654',
      emailAddress: 'em1990@test.ca',
      postalCodeFsa: 'C9C',
      preferredLocation: 'Vancouver Island',
      program: 'HCA',
    },
    {
      callbackStatus: false,
      lastName: 'Freddy',
      firstName: 'Foo',
      maximusId: 6488695,
      interested: 'yes',
      postalCode: 'V1V2V3',
      phoneNumber: '2501112222',
      emailAddress: 'foo@test.com',
      postalCodeFsa: 'V1V',
      preferredLocation: 'Vancouver Island',
      program: 'HCA',
    },
    {
      callbackStatus: false,
      nonHCAP: 'yes',
      crcClear: 'yes',
      lastName: 'Gemma',
      firstName: 'Gusto',
      maximusId: 6488696,
      interested: 'yes',
      postalCode: 'X1X1X1',
      phoneNumber: '7781112222',
      emailAddress: 'gem@gemma.gusto.ca',
      postalCodeFsa: 'X1X',
      preferredLocation: 'Vancouver Coastal',
      program: 'HCA',
    },
    {
      callbackStatus: false,
      nonHCAP: 'no',
      crcClear: 'yes',
      lastName: 'Jerry',
      firstName: 'Jenkins',
      maximusId: 6488699,
      interested: 'no',
      postalCode: 'X1X1X1',
      phoneNumber: '7784445555',
      emailAddress: 'jj@test.com',
      postalCodeFsa: 'X1X',
      preferredLocation: 'Northern',
      program: 'HCA',
    },
    {
      callbackStatus: false,
      lastName: 'Isabelle',
      firstName: 'Isaac',
      maximusId: 6488698,
      postalCode: 'Z0Z0Z0',
      phoneNumber: '7783334444',
      emailAddress: 'isa@example.com',
      postalCodeFsa: 'Z0Z',
      preferredLocation: 'Interior',
      program: 'HCA',
    },
    {
      callbackStatus: false,
      crcClear: 'yes',
      lastName: 'Hector',
      firstName: 'Hux',
      maximusId: 6488697,
      interested: 'yes',
      postalCode: 'Z0Z0Z0',
      phoneNumber: '7782223333',
      emailAddress: 'hux123@example.com',
      postalCodeFsa: 'Z0Z',
      preferredLocation: 'Fraser;Vancouver Coastal',
      program: 'HCA',
    },
  ];

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
    expect(res.data.map((item) => Object.keys(item))).toEqual(
      allParticipants.map(() => participantFields)
    );
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

    const received = res.data.map((item) => Object.keys(item));
    const expected = allParticipants.map(() => participantFields);
    expect(received).toEqual(expected);
  });

  it('Get participants as HA, receive successfully', async () => {
    const res = await getParticipants({
      isMoH: false,
      isSuperUser: false,
      regions,
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
    const trimIds = (a) =>
      a.map((i) =>
        Object.keys(i)
          .filter((k) => !['id', 'callbackStatus', 'userUpdatedAt'].includes(k)) // TODO: Should not ignore callback status
          .reduce((o, k) => ({ ...o, [k]: i[k] }), { nonHCAP: undefined })
      );

    const expected = mapRawToEmployerColumns(
      allParticipants.filter((i) => evaluateBooleanAnswer(i.interested))
    );
    expect(trimIds(res.data)).toEqual(expect.arrayContaining(expected));
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

    const participant1 = {
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
    };

    const participant2 = {
      maximusId: 648691,
      lastName: 'Extra',
      firstName: 'Eduardo',
      postalCode: 'V1V2V3',
      postalCodeFsa: 'V1V',
      phoneNumber: '2502223333',
      emailAddress: 'eddy@example.com',
      interested: 'yes',
      nonHCAP: 'yes',
      crcClear: 'no',
      preferredLocation: 'Fraser',
    };

    const participant3 = {
      maximusId: 648692,
      lastName: 'Extra',
      firstName: 'Emanuel',
      postalCode: 'V1V2V3',
      postalCodeFsa: 'V1V',
      phoneNumber: '2502223333',
      emailAddress: 'eddy@example.com',
      interested: 'no',
      nonHCAP: 'yes',
      crcClear: 'no',
      preferredLocation: 'Fraser',
    };

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

    const participant1 = {
      lastName: 'Extra',
      firstName: 'Eddy',
      phoneNumber: '2502223333',
      emailAddress: 'eddy@example.com',
      interested: 'yes',
      nonHCAP: 'yes',
      crcClear: 'yes',
      preferredLocation: 'Fraser',
      contactedDate: '09/09/2020',
    };

    const response = await makeParticipant(participant1);
    await setParticipantStatus(employerAId, response.id, ps.PROSPECTING);
    await setParticipantStatus(employerAId, response.id, ps.INTERVIEWING, {
      contacted_at: participant1.contactedDate,
    });
    await setParticipantStatus(employerAId, response.id, ps.OFFER_MADE);
    await setParticipantStatus(employerAId, response.id, ps.HIRED, {
      nonHcapOpportunity: 'no',
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
    const participantData = {
      maximusId: 648691,
      lastName: 'Extra',
      firstName: 'Eduardo',
      postalCode: 'V1V2V3',
      postalCodeFsa: 'V1V',
      phoneNumber: '2502223333',
      emailAddress: 'eddy@example.com',
      interested: 'yes',
      nonHCAP: 'yes',
      crcClear: 'no',
      preferredLocation: 'Fraser',
    };

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

    const participant1 = {
      lastName: 'Extra',
      firstName: 'Eddy',
      phoneNumber: '2502223333',
      emailAddress: 'eddy@example.com',
      interested: 'yes',
      nonHCAP: 'yes',
      crcClear: 'yes',
      preferredLocation: 'Fraser',
      contactedDate: '09/09/2020',
    };

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
      nonHcapOpportunity: 'no',
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
    const participant1 = {
      lastName: 'Extra',
      firstName: 'Eddy',
      phoneNumber: '2502223333',
      emailAddress: 'eddy1@example.com',
      interested: 'yes',
      nonHCAP: 'yes',
      crcClear: 'yes',
      preferredLocation: 'Fraser',
      contactedDate: '09/09/2020',
    };

    const participant2 = {
      lastName: 'Extra',
      firstName: 'Eddy-ss',
      phoneNumber: '2502223333',
      emailAddress: 'eddy1@example.com',
      interested: 'yes',
      nonHCAP: 'yes',
      crcClear: 'yes',
      preferredLocation: 'Interior',
      contactedDate: '08/09/2020',
    };

    await makeParticipant(participant1);
    await makeParticipant(participant2);
    const userId = v4();

    const result2 = await getParticipantsForUser(userId, 'eddy1@example.com');
    expect(result2.length).toEqual(2);
    expect(result2[0].emailAddress).toEqual('eddy1@example.com');

    const participant3 = {
      lastName: 'Extra',
      firstName: 'Eddy-New',
      phoneNumber: '2502223333',
      emailAddress: 'eddy1@example.com',
      interested: 'yes',
      nonHCAP: 'yes',
      crcClear: 'yes',
      preferredLocation: 'Interior',
      contactedDate: '07/09/2020',
    };

    await makeParticipant(participant3);

    const result3 = await getParticipantsForUser(userId, 'eddy1@example.com');
    expect(result3.length).toEqual(3);
  });

  it('should map participant with user', async () => {
    const participant1 = {
      lastName: 'Extra',
      firstName: 'Eddy',
      phoneNumber: '2502223333',
      emailAddress: 'eddy2990@example.com',
      interested: 'yes',
      nonHCAP: 'yes',
      crcClear: 'yes',
      preferredLocation: 'Fraser',
      contactedDate: '09/09/2020',
    };

    const resp = await makeParticipant(participant1);
    const userId = v4();

    await mapUserWithParticipant(userId, resp.id);
    const result = await getParticipantsForUser(userId, 'eddy2990@example.com');
    expect(result[0].emailAddress).toEqual('eddy2990@example.com');
  });
  it('Should withdraw multiple participants', async () => {
    // Setup
    const participantData = {
      lastName: 'Extra',
      firstName: 'Eddy',
      phoneNumber: '2502223333',
      emailAddress: 'eddy2990@example.com',
      interested: 'yes',
      nonHCAP: 'yes',
      crcClear: 'yes',
      preferredLocation: 'Fraser',
      contactedDate: '09/09/2020',
    };

    const resp1 = await makeParticipant(participantData);
    const resp2 = await makeParticipant(participantData);

    const userId = v4();

    await mapUserWithParticipant(userId, resp1.id);
    await mapUserWithParticipant(userId, resp2.id);

    await withdrawParticipantsByEmail(userId, participantData.emailAddress);
    const finalParticipants = await getParticipantsForUser(userId, participantData.emailAddress);
    finalParticipants.forEach((participant) => {
      expect(participant.interested).toEqual('withdrawn');
    });
  });
  it('Getting participants should return hired data.', async () => {
    const participantData = {
      lastName: 'Extra',
      firstName: 'Eddy',
      phoneNumber: '2502223333',
      emailAddress: 'eddy2990@example.com',
      interested: 'yes',
      nonHCAP: 'yes',
      crcClear: 'yes',
      preferredLocation: 'Fraser',
      contactedDate: '09/09/2020',
    };
    const resp = await makeParticipant(participantData);

    const userId = v4();
    const employerId = 1;

    await mapUserWithParticipant(userId, resp.id);
    // Hire the user
    await setParticipantStatus(employerId, resp.id, ps.PROSPECTING);
    await setParticipantStatus(employerId, resp.id, ps.INTERVIEWING);
    await setParticipantStatus(employerId, resp.id, ps.OFFER_MADE);
    await setParticipantStatus(employerId, resp.id, ps.HIRED);
    const finalParticipants = await getParticipantsForUser(userId, participantData.emailAddress);
    expect(Boolean(finalParticipants.find((participant) => participant.hired.length > 0))).toEqual(
      true
    );
  });

  it('should returns post hire statuses', async () => {
    await closeDB();
    await startDB();
    await approveUsers(employer);
    const employerAId = 1;

    const participant1 = {
      lastName: 'Extra',
      firstName: 'Eddy',
      phoneNumber: '2502223333',
      emailAddress: 'eddy@example.com',
      interested: 'yes',
      nonHCAP: 'yes',
      crcClear: 'yes',
      preferredLocation: 'Fraser',
      contactedDate: '09/09/2020',
    };

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
