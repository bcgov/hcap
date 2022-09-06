/* eslint-disable camelcase */
// disabling camelcase check so that we can manipulate snake_case attributes without changing structure
const dayjs = require('dayjs');
const isBetween = require('dayjs/plugin/isBetween');
const { dbClient, collections } = require('../db');
const { getSiteByID } = require('./employers');

dayjs.extend(isBetween);

const getAllSitePhases = async (siteId) => {
  const [site] = await getSiteByID(siteId);
  // siteDataId is the id in the data attribute, not the table PK
  const siteDataId = site.siteId;
  const sitePhases = await dbClient.db[collections.GLOBAL_PHASE]
    .join({
      [collections.SITE_PHASE_ALLOCATION]: {
        type: 'LEFT OUTER',
        relation: collections.SITE_PHASE_ALLOCATION,
        on: {
          phase_id: 'id',
          site_id: siteId,
        },
      },
      // TODO: What we actually want is to have it be on: filter so that hired range is between startDate and endDate
      // could not NULL COALESCE the start/end dates, and could not use comparitive operators (<=, etc turned to =).
      // so we get all the hires and filter afterwards.
      hires: {
        type: 'LEFT OUTER',
        relation: collections.PARTICIPANTS_STATUS,
        on: {
          status: 'hired',
          'data.site': siteDataId,
        },
      },
      archivedJoin: {
        type: 'LEFT OUTER',
        relation: collections.PARTICIPANTS_STATUS,
        on: {
          participant_id: 'hires.participant_id',
          status: 'archived',
          current: true,
          'data.type': 'duplicate',
        },
      },
    })
    .find({ 'archivedJoin.participant_id': null });

  // merge the site-specific allocation data into the global phase,
  // overwriting global properties with specific where named the same (except id)
  const phaseData = sitePhases.map((phase) => {
    let sitePhase = phase;

    if (phase.site_phase_allocation.length > 0) {
      const sitePhaseAllocation = phase.site_phase_allocation[0];
      const start_date = sitePhaseAllocation.start_date ?? phase.start_date;
      const end_date = sitePhaseAllocation.end_date ?? phase.end_date;
      const allocation = sitePhaseAllocation.allocation ?? 0;
      const site_phase_allocation_id = sitePhaseAllocation.id;

      sitePhase = {
        ...sitePhase,
        start_date,
        end_date,
        allocation,
        site_phase_allocation_id,
      };
    }

    const phaseHires = phase.hires.filter((hire) =>
      dayjs(hire.data.hiredDate).isBetween(sitePhase.start_date, sitePhase.end_date, null, '()')
    );
    // count HCAP and non-HCAP hires
    sitePhase.hcapHires = phaseHires.filter((hire) => !hire.data.nonHcapOpportunity).length;
    sitePhase.nonHcapHires = phaseHires.filter((hire) => hire.data.nonHcapOpportunity).length;

    // strip time/timezone from date
    sitePhase.start_date = dayjs.utc(sitePhase.start_date).format('YYYY/MM/DD');
    sitePhase.end_date = dayjs.utc(sitePhase.end_date).format('YYYY/MM/DD');

    // remove join attributes
    delete sitePhase.site_phase_allocation;
    delete sitePhase.archivedJoin;
    delete sitePhase.hires;

    return {
      id: sitePhase.id,
      phaseName: sitePhase.name,
      startDate: sitePhase.start_date,
      endDate: sitePhase.end_date,
      allocation: sitePhase.allocation,
      remainingHires: (sitePhase.allocation ?? 0) - sitePhase.hcapHires,
      hcapHires: sitePhase.hcapHires,
      nonHcapHires: sitePhase.nonHcapHires,
    };
  });
  return phaseData;
};

const createGlobalPhase = async (phase, user) => {
  const phaseJson = { ...phase, created_by: user.id, updated_by: user.id };
  const res = await dbClient.db[collections.GLOBAL_PHASE].insert(phaseJson);
  return res;
};

module.exports = { createGlobalPhase, getAllSitePhases };
