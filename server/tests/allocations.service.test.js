// const { ValidationError } = require('yup');
const { v4 } = require('uuid');
const app = require('../server');
const {
  // getPhaseAllocation,
  createPhaseAllocation,
  updatePhaseAllocation,
} = require('../services/allocations.js');

const { startDB, closeDB } = require('./util/db');

describe('Phase Allocation Endpoints', () => {
  let server;

  beforeAll(async () => {
    await startDB();
    server = app.listen();
  });

  afterAll(async () => {
    await closeDB();
    server.close();
  });

  const user = v4();
  // Used for batch site POST
  const allocation = {
    site_id: 1,
    phase_id: 1,
    allocation: 30,
  };

  it('Set new allocation, receive success', async () => {
    const res = await createPhaseAllocation(allocation, user);
    const expectedRes = [{ id: 1, site_id: 1, phase_id: 1, allocation: 67 }];
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
    expect(res.allocation).toEqual(90);
  });
});
