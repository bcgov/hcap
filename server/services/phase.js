/* eslint-disable camelcase */
// disabling camelcase check so that we can manipulate snake_case attributes without changing structure
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { dbClient, collections } from '../db';
import { getSiteByID } from './employers';

dayjs.extend(isBetween);

/**
 * @typedef {import('./employers').EmployerSite} employerSite
 *
 * @typedef  {Object} sitePhase
 * @property {number} id             Internal ID of the phase
 * @property {string} phaseName      Human readable phase name
 * @property {string} startDate      Date string seperated by slashes, e.g. '2020/01/01'
 * @property {string} endDate        Date string seperated by slashes, e.g. '2020/01/01'
 * @property {number} allocation     Number of allocations available
 * @property {number} remainingHires Number of remaining hires
 * @property {number} hcapHires      Number of hires from HCAP
 * @property {number} nonHcapHires   Number of hires from outside HCAP
 */

/**
 * Gets all phases for a site
 * @param {number} siteId Database ID of the site
 * @returns {Promise<sitePhase[]>} Phases for the site
 */
export const getAllSitePhases = async (siteId) => {
  const site = await getSiteByID(siteId);

  /**
   * @typedef {Object} sitePhasesResponse  Internal type for DB response to the `getAllSitePhases` query
   * @property {number} id                 Internal ID of the phase
   * @property {string} name               Name of the phase
   * @property {Date} start_date           Start date of the phase
   * @property {Date} end_date             End date of the phase
   * @property {number} allocation         Number of employees allocated for this phase at this site
   * @property {number} allocation_id      Internal ID of the allocation connected to the site/phase
   * @property {string} hcap_hires         Number of HCAP employees hired (as a string)
   * @property {string} non_hcap_hires     Number of non-HCAP employees hired (as a string)
   */

  /**
   * Raw result from a custom query.
   *
   * This query essentially performs the following actions:
   * * Grabs all phases
   * * Finds the phase allocations for each phase at this site
   * * For each phase, counts the number of currently hired employees within its timespan
   * * Splits these hires into HCAP and non-HCAP hires
   * @type {sitePhasesResponse[]}
   */
  const sitePhases = await dbClient.runRawQuery(
    `
    SELECT 
      phase.id, 
      phase.name, 
      phase.start_date, 
      phase.end_date, 
      spa.allocation, 
      spa.id as allocation_id,
      count(ps.id) FILTER (
        WHERE 
          ps.data ->> 'nonHcapOpportunity' = 'false'
      ) AS hcap_hires, 
      count(ps.id) FILTER (
        WHERE 
          ps.data ->> 'nonHcapOpportunity' = 'true'
      ) AS non_hcap_hires 
    FROM 
      phase 
      LEFT JOIN site_phase_allocation spa ON phase.id = spa.phase_id AND spa.site_id = '$1'
      LEFT JOIN participants_status ps ON
        ps.DATA ->> 'site' = '$1'
        AND ps."current"
        AND to_date(
          ps.data ->> 'hiredDate', 'YYYY/MM/DD'
        ) BETWEEN phase.start_date AND phase.end_date
    GROUP BY 
      phase.id, 
      spa.id
    `,
    [site.id]
  );

  // Transform data format and return it
  return sitePhases.map((phase) => ({
    id: phase.id,
    phaseName: phase.name,
    allocationId: phase.allocation_id,
    startDate: dayjs.utc(phase.start_date).format('YYYY/MM/DD'),
    endDate: dayjs.utc(phase.end_date).format('YYYY/MM/DD'), // strips time/timezone from date and formats it
    allocation: phase.allocation,
    remainingHires: (phase.allocation ?? 0) - Number(phase.hcap_hires),
    hcapHires: Number(phase.hcap_hires),
    nonHcapHires: Number(phase.non_hcap_hires),
  }));
};

export const getAllPhases = async () => {
  // NOTE: this will not allow for full access to the phase list once it hits that 100k limit!
  // If there is any chance of this hitting that number, or if performance starts to suffer,
  // pagination support should be added.
  const phases = await dbClient.db[collections.GLOBAL_PHASE].find({}, { limit: 100000 });
  return phases;
};

export const checkDateOverlap = async (startDate, endDate, id) => {
  const phaseData = await dbClient.db[collections.GLOBAL_PHASE].find({}, { limit: 100000 });
  // remove the phase getting edited from the array of phases used to validate overlaps
  const filteredData = id ? phaseData.filter((phase) => Number(id) !== phase.id) : phaseData;

  const isDateRangeInvalid = filteredData.some((phase) => {
    const phaseStartDate = Date.parse(phase.start_date);
    const phaseEndDate = Date.parse(phase.end_date);
    const formStartDate = Date.parse(startDate);
    const formEndDate = Date.parse(endDate);
    const startDateExistsWithin = formStartDate > phaseStartDate && formStartDate < phaseEndDate;
    const endDateExistsWithin = formEndDate > phaseStartDate && formEndDate < phaseEndDate;
    const overlaps = formStartDate < phaseStartDate && formEndDate > phaseEndDate;

    return startDateExistsWithin || endDateExistsWithin || overlaps;
  });

  return isDateRangeInvalid;
};

export const createPhase = async (phase, user) => {
  const phaseData = { ...phase, created_by: user.id, updated_by: user.id };
  const res = await dbClient.db[collections.GLOBAL_PHASE].insert(phaseData);
  return res;
};

export const updatePhase = async (phaseId, phase, user) => {
  const phaseData = { ...phase, updated_by: user.id };
  const res = await dbClient.db[collections.GLOBAL_PHASE].update(phaseId, phaseData);
  return res;
};
