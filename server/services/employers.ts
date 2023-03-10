import { dbClient, collections } from '../db';
import { userRegionQuery } from './user';
import type { HcapUserInfo } from '../keycloak';
import { formatDateSansTimezone } from '../utils';
import { Allocation } from '../services/allocations';

export interface EmployerSite {
  id: number; // Internal ID for site
  siteId: number; // User-visible ID for site
  siteName: string; // Name of site
  operatorName: string; // Name of operator (e.g. 'Interior Health Authority')
  city: string; // City the site is in
  healthAuthority: string; // Authority for the site
  postalCode: string; // Postal code of site
  allocation: number; // Number of allocations set
  startDate: Date; // start date of current phase
  endDate: Date; // end date of current phase
  hcapHires?: number;
  nonHcapHires?: number;
}

export const getEmployers = async (user: HcapUserInfo): Promise<EmployerSite[]> => {
  const criteria =
    user.isSuperUser || user.isMoH ? {} : userRegionQuery(user.regions, 'healthAuthority');
  return criteria ? dbClient.db[collections.EMPLOYER_FORMS].findDoc(criteria) : [];
};

export const getEmployerByID = async (id: number) =>
  dbClient.db[collections.EMPLOYER_FORMS].findDoc({ id });

export const saveSingleSite = async (sitePayload) => {
  const res = await dbClient.db.saveDoc(collections.EMPLOYER_SITES, sitePayload);
  return res;
};

export const updateSite = async (id: number, site) => {
  const changes = site.history[0].changes.reduce(
    (acc, change) => {
      const { field, to } = change;
      return { ...acc, [field]: to };
    },
    { history: site.history, userUpdatedAt: new Date().toJSON() }
  );

  return dbClient.db[collections.EMPLOYER_SITES].updateDoc({ id }, changes);
};

export const getAllSites = async () =>
  dbClient.db[collections.EMPLOYER_SITES].findDoc(
    {},
    {
      order: [
        {
          field: 'body.siteName',
        },
      ],
    }
  );

const getSitesWithCriteria = async (additionalCriteria, additionalCriteriaParams) => {
  // Raw SQL was required here because `options.fields` wouldn't work with `join` https://github.com/bcgov/hcap/pull/834#pullrequestreview-1100927873
  const records = await dbClient.db.query(
    `
    SELECT
    employer_sites.id as "id",
    employer_sites.body -> 'siteId' as "siteId",
    employer_sites.body -> 'siteName' as "siteName",
    employer_sites.body -> 'operatorName' as "operatorName",
    employer_sites.body -> 'city' as "city",
    employer_sites.body -> 'healthAuthority' as "healthAuthority",
    employer_sites.body -> 'postalCode' as "postalCode",
    spa.allocation,
    p.start_date as "startDate", 
    p.end_date as "endDate"
  FROM
    employer_sites
    LEFT JOIN phase p ON CURRENT_DATE BETWEEN p.start_date AND p.end_date
    LEFT JOIN site_phase_allocation spa ON spa.site_id = employer_sites.id and spa.phase_id = p.id
  ${additionalCriteria.length > 0 ? 'WHERE' : ''}
    ${additionalCriteria.join(' AND ')}
  ORDER BY
    employer_sites.body -> 'siteName';
`,
    additionalCriteriaParams
  );

  // Transform and format dates - return data
  return records.map((site) => ({
    ...site,
    startDate: formatDateSansTimezone(site.startDate),
    endDate: formatDateSansTimezone(site.endDate), // strips time/timezone from date and formats it
  }));
};

/**
 * Get all accessible sites for a user
 * @param user  User with roles and sites to filter
 * @returns List of sites which the user has access to
 */
export const getSitesForUser = async (user: HcapUserInfo): Promise<EmployerSite[]> => {
  const additionalCriteria = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const additionalCriteriaParams: { userSites?: any[]; userRegions?: string[] } = {};

  if ((user.isHA || user.isEmployer) && user.sites.length > 0) {
    additionalCriteria.push(`(employer_sites.body ->> 'siteId')::INT IN ($(userSites:csv))`);
    additionalCriteriaParams.userSites = user.sites;
  }

  if (user.isHA && user.regions.length > 0) {
    additionalCriteria.push(`employer_sites.body ->> 'healthAuthority' IN ($(userRegions:csv))`);
    additionalCriteriaParams.userRegions = user.regions;
  }
  return getSitesWithCriteria(additionalCriteria, additionalCriteriaParams);
};

/**
 * Get all sites for regions, returning nothing if there's no regions passed in
 * @param regions  Regions to get sites for
 * @returns List of sites within a region
 */
export const getSitesForRegion = async (regions: string[]): Promise<EmployerSite[]> => {
  if (regions.length > 0) {
    const additionalCriteria = [];

    additionalCriteria.push(`employer_sites.body ->> 'healthAuthority' IN ($(userRegions:csv))`);
    const additionalCriteriaParams = { userRegions: regions };
    return getSitesWithCriteria(additionalCriteria, additionalCriteriaParams);
  }
  return [];
};

export const getSiteDetailsById = async (id) => {
  const site = await dbClient.db[collections.EMPLOYER_SITES].findDoc({ id });
  if (site.length === 0) {
    return [{ error: `No site found with id` }];
  }
  return site;
};

/**
 * @param id  ID of requested site
 * @returns Requested site
 */
export const getSiteByID = async (id: number): Promise<EmployerSite> => {
  const site = await dbClient.db[collections.EMPLOYER_SITES].findDoc({ id });
  if (site.length === 0) {
    throw new Error(`No site found with id ${id}`);
  }

  const allocationResponse: Allocation[] = await dbClient.runRawQuery(
    `
    SELECT spa.allocation
      FROM site_phase_allocation spa
        JOIN (
          SELECT id FROM phase
          WHERE CURRENT_DATE BETWEEN start_date AND end_date
          LIMIT 1
        ) p ON p.id = spa.phase_id
      WHERE spa.site_id = $1;
    `,
    [site[0].id]
  );
  // Counting hire
  // Join Criteria for duplicate participant
  const duplicateArchivedJoin = {
    type: 'LEFT OUTER',
    relation: collections.PARTICIPANTS_STATUS,
    on: {
      participant_id: 'participant_id',
      status: 'archived',
      current: true,
      'data.type': 'duplicate',
    },
  };
  const hcapHires = await dbClient.db[collections.PARTICIPANTS_STATUS]
    .join({
      duplicateArchivedJoin,
    })
    .count({
      'data.site': site[0].siteId,
      'data.nonHcapOpportunity': 'false',
      'duplicateArchivedJoin.status': null,
    });
  const nonHcapHires = await dbClient.db[collections.PARTICIPANTS_STATUS]
    .join({
      duplicateArchivedJoin,
    })
    .count({
      'data.site': site[0].siteId,
      'data.nonHcapOpportunity': 'true',
      'duplicateArchivedJoin.status': null,
    });

  const currentAllocation = allocationResponse.length ? allocationResponse[0].allocation : null;

  site[0].hcapHires = hcapHires;
  site[0].nonHcapHires = nonHcapHires;
  site[0].allocation = currentAllocation;
  return site[0];
};
