/**
 * Tests for services/phase.js
 */
import { v4 } from 'uuid';
import { app } from '../server';
import { getAllSitePhases, getAllPhases, createPhase, updatePhase } from '../services/phase';

import { siteData } from './util/testData';
import { makeTestSite } from './util/integrationTestData';

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

  it('Create new phase, receive success', async () => {
    const phaseMock = {
      name: 'Test Phase name',
      start_date: '2023/10/12',
      end_date: '2025/10/12',
    };
    const res = await createPhase(phaseMock, user);
    expect(res.name).toEqual('Test Phase name');
  });

  it('Update phase, receive success', async () => {
    const res = await updatePhase(
      1,
      {
        start_date: '2024/10/12',
        end_date: '2027/10/12',
      },
      user
    );
    expect(res.start_date).toEqual(new Date('2024/10/12'));
    expect(res.end_date).toEqual(new Date('2027/10/12'));
  });

  it('getAllPhases, returns all phase records', async () => {
    const res = await getAllPhases();
    expect(res[0].name).toEqual('Test Phase name');
    expect(res.length).not.toEqual(0);
  });

  it('getAllSitePhases, returns all phase records and allocations for the site', async () => {
    const siteMock = siteData({
      siteId: 7,
      siteName: 'Test phase',
      operatorEmail: 'test.e2e.phase@hcap.io',
    });
    const site = await makeTestSite(siteMock);
    const res = await getAllSitePhases(site.id);
    expect(res.length).not.toEqual(0);
  });
});