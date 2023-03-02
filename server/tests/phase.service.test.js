/**
 * Tests for services/phase.js
 */
import { v4 } from 'uuid';
import { app } from '../server';
import {
  getAllSitePhases,
  getAllPhases,
  createPhase,
  updatePhase,
  checkDateOverlap,
} from '../services/phase';
import { createAllocation } from '../services/allocations';

import { siteData } from './util/testData';
import {
  makeTestParticipant,
  makeTestParticipantStatus,
  makeTestSite,
} from './util/integrationTestData';

import { startDB, closeDB } from './util/db';
import { ParticipantStatus } from '../constants';

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
    const numAllocations = 30;
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
        allocation: numAllocations,
      },
      user
    );
    await createAllocation(
      {
        site_id: site.id,
        phase_id: phaseYearTwo.id,
        allocation: numAllocations,
      },
      user
    );

    // Helper function for creating a participant with a hired status
    const makeHiredParticipant = async ({
      emailAddress,
      employerId,
      siteId,
      hiredDate,
      startDate,
    }) => {
      const participant = await makeTestParticipant({ emailAddress });
      await makeTestParticipantStatus({
        participantId: participant.id,
        employerId,
        status: ParticipantStatus.HIRED,
        current: true,
        data: {
          site: siteId,
          hiredDate,
          startDate,
          nonHcapOpportunity: false,
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

    hiredStartDates.map(async (hiredStartDate, i) => {
      await makeHiredParticipant({
        emailAddress: `participantemail${i}@test.com`,
        employerId: 1,
        siteId: site.siteId,
        hiredDate: hiredStartDate.hiredDate,
        startDate: hiredStartDate.startDate,
      });
    });

    // Testing get all phases for the site to see how many hires for each phase
    const sitePhases = await getAllSitePhases(site.id);
    const retrievedPhaseYearOne = sitePhases.find((phase) => phase.id === phaseYearOne.id);
    const retrievedPhaseYearTwo = sitePhases.find((phase) => phase.id === phaseYearTwo.id);

    expect(retrievedPhaseYearOne.hcapHires).toEqual(2);
    expect(retrievedPhaseYearOne.remainingHires).toEqual(numAllocations - 2);
    expect(retrievedPhaseYearTwo.hcapHires).toEqual(1);
    expect(retrievedPhaseYearTwo.remainingHires).toEqual(numAllocations - 1);
  });
});
