/* eslint-disable */
// const { ValidationError } = require('yup');
const { v4 } = require('uuid');
const app = require('../server');
const {
  // getPhaseAllocation,
  createPhaseAllocation,
  updatePhaseAllocation,
} = require('../services/allocations.js');

const { createGlobalPhase } = require('../services/phase');
const { siteData } = require('./util/testData');
const { makeTestSite } = require('./util/integrationTestData');

const { startDB, closeDB } = require('./util/db');

describe('Phase Allocation Endpoints', () => {
  let server;

  const dataSetup = async () => {
    const site = makeTestSite({
      siteId: 202205252325,
      siteName: 'Test Site 1040',
      city: 'Test City 1040',
      id: 1,
    });
    expect(site.id).toBeDefined();
    const phase = await createGlobalPhase(phaseData);
    expect(phase.id).toBeDefined();
    return {
      site,
      phase,
    };
  };

  beforeAll(async () => {
    await startDB();
    server = app.listen();
    dataSetup();
  });

  afterAll(async () => {
    await closeDB();
    server.close();
  });

  const user = { id: v4() };
  const allocationMock = {
    site_id: 1,
    phase_id: 1,
    allocation: 30,
  };

  const expectedRes = {
    ...allocationMock,
    id: 1,
    created_by: user.id,
    created_at: new Date(),
    updated_by: user.id,
    updated_at: new Date(),
  };

  it('Set new allocation, receive success', async () => {
    const res = await createPhaseAllocation(allocationMock, user);
    expect(res).toEqual(expectedRes);
  });

  it('Update allocation, receive success', async () => {
    const res = await updatePhaseAllocation(
      1,
      {
        allocation: 90,
        site_id: 1,
        phase_id: 1,
      },
      user
    );
    expect(res).toEqual({ ...expectedRes, allocation: 90 });
  });
});
