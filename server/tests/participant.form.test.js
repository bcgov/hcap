/* eslint-disable no-restricted-syntax, no-await-in-loop */
const { readFileSync } = require('fs');
const { join } = require('path');
const { ValidationError } = require('yup');
const { startDB, closeDB } = require('./util/db');
const {
  parseAndSaveParticipants,
  getParticipants,
  setParticipantStatus,
} = require('../services/participants.js');
const { evaluateBooleanAnswer } = require('../validation');

describe('Participants Service', () => {
  beforeAll(async () => {
    await startDB();
  });

  afterAll(async () => {
    await closeDB();
  });

  const allParticipants = [
    {
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
      crcClear: 'yes',
      lastName: 'Cindy',
      firstName: 'Callback',
      maximusId: 6488692,
      postalCode: 'X2X2X2',
      phoneNumber: '7780987654',
      emailAddress: 'cindy@example.ca',
      postalCodeFsa: 'X2X',
      preferredLocation: 'Northern',
    },
    {
      lastName: 'Doug',
      firstName: 'Douglas',
      maximusId: 6488693,
      interested: 'yes',
      postalCode: 'C9C8C7',
      phoneNumber: '6051234567',
      emailAddress: 'doug@test.bc.gov',
      postalCodeFsa: 'C9C',
      preferredLocation: 'Vancouver Coastal;Vancouver Island',
    },
    {
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
    },
    {
      lastName: 'Freddy',
      firstName: 'Foo',
      maximusId: 6488695,
      interested: 'yes',
      postalCode: 'V1V2V3',
      phoneNumber: '2501112222',
      emailAddress: 'foo@test.com',
      postalCodeFsa: 'V1V',
      preferredLocation: 'Vancouver Island',
    },
    {
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
    },
    {
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
    },
    {
      lastName: 'Isabelle',
      firstName: 'Isaac',
      maximusId: 6488698,
      postalCode: 'Z0Z0Z0',
      phoneNumber: '7783334444',
      emailAddress: 'isa@example.com',
      postalCodeFsa: 'Z0Z',
      preferredLocation: 'Interior',
    },
    {
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
    },
  ];

  it('Parse participants xlsx, receive success', async () => {
    const file = readFileSync(join(__dirname, './mock/xlsx/participants-data.xlsx'));
    const res = await parseAndSaveParticipants(file);

    const expectedRes = [
      { id: 6488690, status: 'Success' },
      { id: 6488691, status: 'Success' },
      { id: 6488692, status: 'Success' },
      { id: 6488693, status: 'Success' },
      { id: 6488694, status: 'Success' },
      { id: 6488695, status: 'Success' },
      { id: 6488696, status: 'Success' },
      { id: 6488697, status: 'Success' },
      { id: 6488698, status: 'Success' },
      { id: 6488699, status: 'Success' },
    ];

    expect(res).toEqual(expectedRes);
  });

  it('Parse participants xlsx, receive duplicate errors', async () => {
    const file = readFileSync(join(__dirname, './mock/xlsx/participants-data.xlsx'));
    const res = await parseAndSaveParticipants(file);

    const expectedRes = [
      { id: 6488690, status: 'Duplicate' },
      { id: 6488691, status: 'Duplicate' },
      { id: 6488692, status: 'Duplicate' },
      { id: 6488693, status: 'Duplicate' },
      { id: 6488694, status: 'Duplicate' },
      { id: 6488695, status: 'Duplicate' },
      { id: 6488696, status: 'Duplicate' },
      { id: 6488697, status: 'Duplicate' },
      { id: 6488698, status: 'Duplicate' },
      { id: 6488699, status: 'Duplicate' },
    ];

    expect(res).toEqual(expectedRes);
  });

  it('Parse participants xlsx, receive validation error', async () => {
    const file = readFileSync(join(__dirname, './mock/xlsx/participants-data-error.xlsx'));
    expect(parseAndSaveParticipants(file)).rejects.toEqual(new ValidationError('Please specify a preferred (EOI) location for participant of row 2'));
  });

  it('Get participants as super_user, receive all successfully', async () => {
    const res = await getParticipants({ isSuperUser: true });

    expect(res).toEqual(
      expect.arrayContaining(
        allParticipants.map((item) => (expect.objectContaining(item))),
      ),
    );
  });

  it('Set participant status with different employers, fetch participant with status', async () => {
    const participants = await getParticipants({ isSuperUser: true });

    const employerAId = 12345;
    const employerBId = 12346;

    for (const participant of participants) {
      await setParticipantStatus(employerAId, participant.id, 'status');
      await setParticipantStatus(employerAId, participant.id, 'status2');
      await setParticipantStatus(employerAId, participant.id, 'status3');
    }

    await setParticipantStatus(employerBId, participants[0].id, 'status3');

    const participantsWithStatus = await getParticipants({ isSuperUser: true }, { status: true });

    expect(participantsWithStatus[0].statusInfos[0].employerId).toEqual(employerBId);
    expect(participantsWithStatus[0].statusInfos[1].employerId).toEqual(employerAId);
    expect(participantsWithStatus[1].statusInfos.length).toEqual(1);
    expect(participantsWithStatus[2].statusInfos.length).toEqual(1);
    expect(participantsWithStatus[3].statusInfos.length).toEqual(1);
    expect(participantsWithStatus[4].statusInfos.length).toEqual(1);
    expect(participantsWithStatus[5].statusInfos.length).toEqual(1);
    expect(participantsWithStatus[6].statusInfos.length).toEqual(1);
    expect(participantsWithStatus[7].statusInfos.length).toEqual(1);
    expect(participantsWithStatus[8].statusInfos.length).toEqual(1);
    expect(participantsWithStatus[9].statusInfos.length).toEqual(1);
  });

  it('Get participants as MoH, receive successfully', async () => {
    const res = await getParticipants({
      isMoH: true,
    });

    expect(res.map((item) => (Object.keys(item)))).toEqual(
      allParticipants.map(() => ([
        'id',
        'firstName',
        'lastName',
        'postalCode',
        'preferredLocation',
        'nonHCAP',
        'interested',
        'crcClear',
      ])),
    );
  });

  it('Get participants as HA, receive successfully', async () => {
    const res = await getParticipants({
      isMoH: false,
      isSuperUser: false,
      regions: [
        'Fraser',
        'Interior',
        'Northern',
        'Vancouver Coastal',
        'Vancouver Island',
      ],
    });

    const filteredParticipants = allParticipants
      .filter((item) => (
        evaluateBooleanAnswer(item.interested)
        && evaluateBooleanAnswer(item.crcClear)));

    expect(res.map((item) => (Object.keys(item)))).toEqual(
      filteredParticipants.map(() => ([
        'id',
        'firstName',
        'lastName',
        'postalCode',
        'preferredLocation',
        'nonHCAP',
      ])),
    );
  });
});
