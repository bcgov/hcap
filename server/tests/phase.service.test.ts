/**
 * Tests for services/phase.js
 */
import { app } from '../server';
import {
  getAllSitePhases,
  getAllPhases,
  createPhase,
  updatePhase,
  checkDateOverlap,
} from '../services/phase';
import { createAllocation } from '../services/allocations';
import { approveUsers, employer } from './util/keycloak';

import { siteData } from './util/testData';
import {
  makeTestParticipant,
  makeTestParticipantStatus,
  makeTestSite,
} from './util/integrationTestData';

import { startDB, closeDB } from './util/db';
import { ParticipantStatus, Program } from '../constants';

describe('Phase Allocation Endpoints', () => {
  let server;

  beforeAll(async () => {
    await startDB();
    server = app.listen();
    await approveUsers(employer);
  });

  afterAll(async () => {
    await closeDB();
    server.close();
  });

  const user = { id: 1 };

  it('Create new phase, receive success', async () => {
    const phaseMock = {
      name: 'Test Phase name',
      start_date: '2001/01/01',
      end_date: '2002/01/01',
    };
    const res = await createPhase(phaseMock, user);
    expect(res.name).toEqual('Test Phase name');
  });

  it('Update phase, receive success', async () => {
    const res = await updatePhase(
      1,
      {
        start_date: '2000/12/01',
        end_date: '2002/12/01',
      },
      user
    );
    expect(res.start_date).toEqual(new Date('2000/12/01'));
    expect(res.end_date).toEqual(new Date('2002/12/01'));
  });

  it('checkDateOverlap, returns true if dates are overlapping and invalid', async () => {
    const res = await checkDateOverlap('2001/12/01', '2002/12/01');
    expect(res).toEqual(true);
  });

  it('checkDateOverlap, returns false if dates are not overlapping and valid', async () => {
    const res = await checkDateOverlap('2022/01/01', '2023/01/01');
    expect(res).toEqual(false);
  });

  it('getAllPhases, returns all phase records', async () => {
    const res = await getAllPhases();
    expect(res[0].name).toEqual('Test Phase name');
    expect(res[0]).not.toHaveProperty('allocations');
    expect(res.length).not.toEqual(0);
  });

  it('getAllPhases with includeAllocations, returns all phase records with associated allocations', async () => {
    const includeAllocations = 'true';
    const res = await getAllPhases(includeAllocations);
    expect(res[0].name).toEqual('Test Phase name');
    expect(res[0]).toHaveProperty('allocations');
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

  it('getAllSitePhases, returns correct # of hires and remaining hires per phase', async () => {
    const hcaAllocation = 30;
    const mhawAllocation = 20;
    const phaseMockYearOne = {
      name: '2015 Phase',
      start_date: '2015/01/01',
      end_date: '2015/12/31',
    };
    const phaseMockYearTwo = {
      name: '2016 Phase',
      start_date: '2016/01/01',
      end_date: '2016/12/31',
    };
    const phaseYearOne = await createPhase(phaseMockYearOne, user);
    const phaseYearTwo = await createPhase(phaseMockYearTwo, user);

    const siteMock = siteData({
      siteId: 8,
      siteName: 'Test phase',
      operatorEmail: 'test.e2e.phase@hcap.io',
    });
    const site = await makeTestSite(siteMock);

    // An allocation for each created phase
    await createAllocation(
      {
        site_id: site.id,
        phase_id: phaseYearOne.id,
        allocation: hcaAllocation,
        mhaw_allocation: mhawAllocation,
      },
      user
    );
    await createAllocation(
      {
        site_id: site.id,
        phase_id: phaseYearTwo.id,
        allocation: hcaAllocation,
        mhaw_allocation: mhawAllocation,
      },
      user
    );

    // Helper function for creating a participant with a hired status
    const makeHiredParticipant = async ({
      program = Program.HCA,
      employerId,
      siteId,
      hiredDate,
      startDate,
    }) => {
      const participant = await makeTestParticipant({ program });
      await makeTestParticipantStatus({
        participantId: participant.id,
        employerId,
        status: ParticipantStatus.HIRED,
        current: true,
        data: {
          site: siteId,
          hiredDate,
          startDate,
          program,
        },
      });
    };

    const hiredStartDates = [
      {
        hiredDate: '2015/02/20',
        startDate: '2015/03/01',
      },
      {
        hiredDate: '2015/10/13',
        startDate: '2016/01/15',
      },
      {
        hiredDate: '2016/02/15',
        startDate: '2016/03/15',
      },
      {
        hiredDate: '2017/04/15', // Should not be in a phase
        startDate: '2017/05/15',
      },
    ];

    await Promise.all(
      hiredStartDates.map(async (hiredStartDate) => {
        await makeHiredParticipant({
          program: Program.HCA,
          employerId: 1,
          siteId: site.siteId,
          hiredDate: hiredStartDate.hiredDate,
          startDate: hiredStartDate.startDate,
        });
        await makeHiredParticipant({
          program: Program.MHAW,
          employerId: 1,
          siteId: site.siteId,
          hiredDate: hiredStartDate.hiredDate,
          startDate: hiredStartDate.startDate,
        });
      })
    );

    // Testing get all phases for the site to see how many hires for each phase
    const sitePhases = await getAllSitePhases(site.id);
    const retrievedPhaseYearOne = sitePhases.find((phase) => phase.id === phaseYearOne.id);
    const retrievedPhaseYearTwo = sitePhases.find((phase) => phase.id === phaseYearTwo.id);

    expect(retrievedPhaseYearOne.hcaHires).toEqual(2);
    expect(retrievedPhaseYearOne.remainingHcaHires).toEqual(hcaAllocation - 2);
    expect(retrievedPhaseYearOne.mhawHires).toEqual(2);
    expect(retrievedPhaseYearOne.remainingMhawHires).toEqual(mhawAllocation - 2);
    expect(retrievedPhaseYearTwo.hcaHires).toEqual(1);
    expect(retrievedPhaseYearTwo.remainingHcaHires).toEqual(hcaAllocation - 1);
    expect(retrievedPhaseYearTwo.mhawHires).toEqual(1);
    expect(retrievedPhaseYearTwo.remainingMhawHires).toEqual(mhawAllocation - 1);
  });
});
