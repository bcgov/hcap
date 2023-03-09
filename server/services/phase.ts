/* eslint-disable camelcase */
// disabling camelcase check so that we can manipulate snake_case attributes without changing structure
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { dbClient, collections } from '../db';
import isNull from 'lodash/isNull';
import { HcapUserInfo } from '../keycloak';
import { getSiteByID } from './employers';
import { Allocation } from './allocations';
import { formatDateSansTimezone } from '../utils';

dayjs.extend(isBetween);

type sitePhase = {
  /** Internal ID of the phase */
  id: number;
  /** Human readable phase name */
  phaseName: string;
  /** Date string seperated by slashes, e.g. '2020/01/01' */
  startDate: string;
  /** Date string seperated by slashes, e.g. '2020/01/01' */
  endDate: string;
  /** Number of allocations available */
  allocation: number;
  /** Number of remaining hires */
  remainingHires: number;
  /** Number of hires from HCAP */
  hcapHires: number;
  /** Number of hires from outside HCAP */
  nonHcapHires: number;
};

type phase = {
  /** Internal ID of the phase */
  id: number;
  /** Human readable phase name */
  name: string;
  /** Date string seperated by slashes, e.g. '2020/01/01' */
  start_date: string;
  /** Date string seperated by slashes, e.g. '2020/01/01' */
  end_date: string;
  /** Number of allocations available */
  allocations: Allocation[];
};

/**
 * Gets all phases for a site
 * @param siteId Database ID of the site
 * @returns Phases for the site
 */
export const getAllSitePhases = async (siteId: number): Promise<sitePhase[]> => {
  const site = await getSiteByID(siteId);

  /** Internal type for DB response to the `getAllSitePhases` query */
  type sitePhasesResponse = {
    /** Internal ID of the phase */
    id: number;
    /** Name of the phase */
    name: string;
    /** Start date of the phase */
    start_date: Date;
    /** End date of the phase */
    end_date: Date;
    /** Number of employees allocated for this phase at this site */
    allocation: number;
    /** Internal ID of the allocation connected to the site/phase */
    allocation_id: number;
    /** Number of HCAP employees hired (as a string) */
    hcap_hires: string;
    /** Number of non-HCAP employees hired (as a string) */
    non_hcap_hires: string;
  };

  /**
   * Raw result from a custom query.
   *
   * This query essentially performs the following actions:
   * * Grabs all phases
   * * Finds the phase allocations for each phase at this site
   * * For each phase, counts the number of currently hired employees within its timespan
   * * Splits these hires into HCAP and non-HCAP hires
   */
  const sitePhases: sitePhasesResponse[] = await dbClient.runRawQuery(
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
        ps.DATA ->> 'site' = '$2'
        AND ps."current"
        AND to_date(
          ps.data ->> 'hiredDate', 'YYYY/MM/DD'
        ) BETWEEN phase.start_date AND phase.end_date
    GROUP BY 
      phase.id, 
      spa.id
    `,
    [site.id, site.siteId]
  );

  // Transform data format and return it
  return sitePhases.map((phase) => ({
    id: phase.id,
    phaseName: phase.name,
    allocationId: phase.allocation_id,
    startDate: formatDateSansTimezone(phase.start_date),
    endDate: formatDateSansTimezone(phase.end_date),
    allocation: phase.allocation,
    remainingHires: (phase.allocation ?? 0) - Number(phase.hcap_hires),
    hcapHires: Number(phase.hcap_hires),
    nonHcapHires: Number(phase.non_hcap_hires),
  }));
};

/**
 * Gets all phases with or without associated allocations
 *
 * @param includeAllocations  condition to include associated allocation records - comes from queryParams and is passed as a {includeAllocations: "true"}
 * @returns phase[]   An array of phases with formatted dates
 */
export const getAllPhases = async (includeAllocations: string | null = null): Promise<phase[]> => {
  // NOTE: this will not allow for full access to the phase list once it hits that 100k limit!
  // If there is any chance of this hitting that number, or if performance starts to suffer,
  // pagination support should be added.
  const phases: phase[] = await dbClient.db[collections.GLOBAL_PHASE]
    .join({
      allocations: {
        relation: collections.SITE_PHASE_ALLOCATION,
        type: 'LEFT OUTER',
        omit: !JSON.parse(includeAllocations),
        on: {
          phase_id: 'id',
        },
      },
    })
    .find({}, { limit: 100000 });

  // Transform dates format and return it
  return phases.map((phase) => ({
    ...phase,
    start_date: formatDateSansTimezone(phase.start_date),
    end_date: formatDateSansTimezone(phase.end_date),
  }));
};

export const checkDateOverlap = async (startDate, endDate, id = null) => {
  const phaseData = await getAllPhases();
  // remove the phase getting edited from the array of phases used to validate overlaps
  const filteredData = phaseData.filter((phase) => Number(phase.id) !== Number(id));

  const isDateRangeInvalid = filteredData.some((phase) => {
    const phaseStartDate = Date.parse(phase.start_date);
    const phaseEndDate = Date.parse(phase.end_date);
    const formStartDate = Date.parse(startDate);
    const formEndDate = Date.parse(endDate);
    const startDateExistsWithin = formStartDate >= phaseStartDate && formStartDate <= phaseEndDate;
    const endDateExistsWithin = formEndDate >= phaseStartDate && formEndDate <= phaseEndDate;
    const overlaps = formStartDate <= phaseStartDate && formEndDate >= phaseEndDate;

    return startDateExistsWithin || endDateExistsWithin || overlaps;
  });

  return isDateRangeInvalid;
};

export const createPhase = async (phase, user: HcapUserInfo) => {
  const phaseData = { ...phase, created_by: user.id, updated_by: user.id };
  const res = await dbClient.db[collections.GLOBAL_PHASE].insert(phaseData);
  return res;
};

export const updatePhase = async (phaseId, phase, user: HcapUserInfo) => {
  const phaseData = { ...phase, updated_by: user.id };
  const res = await dbClient.db[collections.GLOBAL_PHASE].update(phaseId, phaseData);
  return res;
};
