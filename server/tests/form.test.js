const request = require('supertest');
const app = require('../server');
const { startDB, closeDB } = require('./util/db');

describe('Server V1 Form Endpoints', () => {
  let server;

  beforeAll(async () => {
    await startDB();
    server = app.listen();
  });

  afterAll(async () => {
    await closeDB();
  });

  const loginEndpoint = '/api/v1/login';
  const formEndpoint = '/api/v1/form';
  const formsEndpoint = '/api/v1/forms';

  const user = {
    username: 'username',
    password: 'password',
  };

  const form = {
    hasDownloadedBCMinistryAgricultureCovid19Requirements: true,
    hasCompletedCovid19WorkplaceRiskAssessment: true,
    hasCreatedCovid19InfectionPreventionAndControlProtocol: true,
    registeredBusinessName: 'Biz Co.',
    firstName: 'John',
    lastName: 'Smith',
    phoneNumber: '1234567890',
    alternatePhoneNumber: null,
    emailAddress: 'a@b.c',
    addressLine1: '1234 Fake St.',
    addressLine2: null,
    city: 'Victoria',
    province: 'British Columbia',
    postalCode: 'V1V1V1',
    isSameAsBusinessAddress: false,
    temporaryForeignWorkerFacilityAddresses: [
      {
        type: 'working',
        addressLine1: '5678 Fake St.',
        addressLine2: null,
        city: 'Edmonton',
        province: 'Alberta',
        postalCode: 'V2V2V2',
      },
    ],
    hasSignage: false,
    hasSomeoneIdentified: false,
    hasContactedLocalMedicalHealthOfficer: false,
    doCommonAreasAllowPhysicalDistancing: false,
    bedroomAccommodation: 'single',
    areBedsInRightConfiguration: false,
    doesUnderstandNeedsForSelfIsolation: false,
    hasSeparateAccommodationForWorker: false,
    hasLaundryServices: false,
    hasDisposableGloves: false,
    hasWasteRemovalSchedule: false,
    hasSturdyLeakResistantGarbageBags: false,
    hasHandWashingSinks: false,
    hasAppropriateSupplyOfSinkWater: false,
    hasPlainSoap: false,
    hasPaperTowels: false,
    hasHandWashingSigns: false,
    hasSleepingArrangements: false,
    hasPhysicalBarriers: false,
    hasScheduleToEnsureTouchAreasAreCleaned: false,
    hasMaterialsOnRiskOfExposure: false,
    hasMaterialsOnHandWashingPhysicalDistancingCoughSneeze: false,
    hasMaterialsOnHandWashingFacilities: false,
    hasMaterialsReadyOnHowToSeekFirstAid: false,
    hasMaterialsReadyOnHowToReportExposure: false,
    hasSchedulesForKitchenEatingAreas: false,
    doWorkersHaveOwnDishware: false,
    isDishwareWashedImmediately: false,
    hasFacilitiesToSeparateAndSelfIsolate: false,
    isPreparedToProvideIndividualsExhibitingSymptoms: false,
    isPreparedToDirectPersonToHealthLinkBC: false,
    isPreparedToCleanAndDisinfectRooms: false,
    isWillingToInformManagementAboutCommercialAccommodation: false,
    isAbleToProvideFoodInSafeManner: false,
    isAbleToPerformAdequateHousekeeping: false,
    isAbleToPerformWasteManagement: false,
    doesCertify: true,
    doesAgree: true,
  };

  it('Create new form, receive 200', async () => {
    const res = await request.agent(app)
      .post(formEndpoint)
      .send(form);
    expect(res.statusCode).toEqual(200);
  });

  it('Create new form using an invalid field, receive 400', async () => {
    const res = await request.agent(app)
      .post(formEndpoint)
      .send({ ...form, bedroomAccommodation: '1' });
    expect(res.statusCode).toEqual(400);
  });

  it('Get existing form, receive 200', async () => {
    const resForm = await request.agent(app)
      .post(formEndpoint)
      .send(form);

    const formId = resForm.body.id;

    const resLogin = await request.agent(app)
      .post(loginEndpoint)
      .send(user);

    const res = await request.agent(app)
      .set({ Accept: 'application/json', 'Content-type': 'application/json', Authorization: `Bearer ${resLogin.body.token}` })
      .get(`${formEndpoint}/${formId}`);

    expect(res.statusCode).toEqual(200);
  });

  it('Get all forms, receive 200', async () => {
    const resLogin = await request.agent(app)
      .post(loginEndpoint)
      .send(user);

    const res = await request.agent(app)
      .set({ Accept: 'application/json', 'Content-type': 'application/json', Authorization: `Bearer ${resLogin.body.token}` })
      .get(formsEndpoint);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(expect.arrayContaining([
      expect.objectContaining({ registeredBusinessName: form.registeredBusinessName }),
    ]));
  });

  it('Get nonexistent form, receive 404', async () => {
    const resLogin = await request.agent(app)
      .post(loginEndpoint)
      .send(user);

    const res = await request.agent(app)
      .set({ Accept: 'application/json', 'Content-type': 'application/json', Authorization: `Bearer ${resLogin.body.token}` })
      .get(`${formEndpoint}/1`);

    expect(res.statusCode).toEqual(404);
  });

  it('Try to get a form without authorization, receive 401 (Unauthorized)', async () => {
    const resForm = await request.agent(app)
      .post(formEndpoint)
      .send(form);

    const formId = resForm.body.id;

    const res = await request.agent(app)
      .set({ Accept: 'application/json', 'Content-type': 'application/json', Authorization: 'Bearer 1' })
      .get(`${formEndpoint}/${formId}`);

    expect(res.statusCode).toEqual(401);
  });

  it('Edit form, receive 200', async () => {
    const resForm = await request.agent(app)
      .post(formEndpoint)
      .send(form);

    const formId = resForm.body.id;

    const resLogin = await request.agent(app)
      .post(loginEndpoint)
      .send(user);

    const res = await request.agent(app)
      .set({ Accept: 'application/json', 'Content-type': 'application/json', Authorization: `Bearer ${resLogin.body.token}` })
      .patch(`${formEndpoint}/${formId}`)
      .send({
        determination: 'passed',
        notes: 'test',
      });

    expect(res.statusCode).toEqual(200);
  });

  it('Edit form missing mandatory attributes, receive 400', async () => {
    const resForm = await request.agent(app)
      .post(formEndpoint)
      .send(form);

    const formId = resForm.body.id;

    const resLogin = await request.agent(app)
      .post(loginEndpoint)
      .send(user);

    const res = await request.agent(app)
      .set({ Accept: 'application/json', 'Content-type': 'application/json', Authorization: `Bearer ${resLogin.body.token}` })
      .patch(`${formEndpoint}/${formId}`)
      .send({
        notes: 'notes',
      });

    expect(res.statusCode).toEqual(400);
  });

  afterAll(() => {
    server.close();
  });
});
