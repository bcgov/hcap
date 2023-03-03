/**
 * Tests for services/allocation.js
 */
import { v4 } from 'uuid';
import { app } from '../server';
import { getAllocation, createAllocation, updateAllocation } from '../services/allocations';
import { makeTestFKAllocations } from './util/integrationTestData';
import { startDB, closeDB } from './util/db';

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

  const user = { id: v4() };

  it('Set new allocation, receive success', async () => {
    const { site, phase } = await makeTestFKAllocations(26356);
    const allocationMock = {
      site_id: site.id,
      phase_id: phase.id,
      allocation: 30,
    };
    const res = await createAllocation(allocationMock, user);
    expect(res.allocation).toEqual(30);
    expect(res.id).toEqual(1);
    expect(res.site_id).toEqual(site.id);
    expect(res.phase_id).toEqual(phase.id);
  });

  it('Update allocation, receive success', async () => {
    const res = await updateAllocation(
      1,
      {
        allocation: 90,
      },
      user
    );
    expect(res.allocation).toEqual(90);
  });

  it('getAllocation, returns empty allocation record', async () => {
    const { site, phase } = await makeTestFKAllocations(3452);
    const res = await getAllocation(site.id, phase.id);
    expect(res).toEqual(null);
  });

  it('getAllocation, returns 1 allocation record', async () => {
    const { site, phase } = await makeTestFKAllocations(35671);
    const allocationMock = {
      site_id: site.id,
      phase_id: phase.id,
      allocation: 45,
    };
    const res = await createAllocation(allocationMock, user);
    expect(res.allocation).toEqual(45);
    expect(res.id).toEqual(2);
    expect(res.site_id).toEqual(site.id);
    expect(res.phase_id).toEqual(phase.id);

    const response = await getAllocation(site.id, phase.id);
    expect(response.allocation).toEqual(45);
  });

  // it('Set bulk allocation, receive success', async () => {
  //   // make multiple sites
  //   const { site, phase } = await makeTestFKAllocations(26356);
  //   const bulkAllocationMock = {
  //     site_id: site.id,
  //     phase_id: phase.id,
  //     allocation: 30,
  //   };
  //   const res = await createAllocation(bulkAllocationMock, user);
  //   expect(res.allocation).toEqual(30);
  //   expect(res.id).toEqual(1);
  //   expect(res.site_id).toEqual(site.id);
  //   expect(res.phase_id).toEqual(phase.id);
  // });
});
