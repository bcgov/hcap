/* eslint-disable camelcase */
import { HcapUserInfo } from '../keycloak';

// disabling camelcase check so that we can manipulate snake_case attributes without changing structure
const { dbClient, collections } = require('../db');

export interface Allocation {
  /** PK ID of the allocation */
  id: number;
  /** FK for phase */
  phase_id: number;
  /** Number of allocations available */
  allocation: number;
  /** FK for employer_site */
  site_id: number;
}

export interface bulkAllocationPayload {
  /** FK for phase */
  phase_id: number;
  /** Number of allocations available */
  allocation: number;
  /** array of FK for employer_sites */
  siteIds: number[];
}

/**
 * Gets allocation record associated with the site and phase
 * @param siteId PK ID of the site
 * @param phaseId PK ID of the phase
 */
export const getAllocation = async (siteId: number, phaseId: number) => {
  const allocation: Allocation = await dbClient.db[collections.SITE_PHASE_ALLOCATION].findOne({
    site_id: siteId,
    phase_id: phaseId,
  });

  return allocation;
};

/**
 * Gets all allocations for a specific phase, given an array of site id's
 * @param siteIds array of PK ID of the site
 * @param phaseId PK ID of the phase
 */
export const getAllocationsForSites = async (siteIds: number[], phaseId: number) => {
  const allocations: Allocation[] = await dbClient.runRawQuery(
    `
    SELECT *
    FROM site_phase_allocation
    WHERE site_id IN (SELECT * FROM unnest($1::int[])) AND phase_id = $2
    `,
    [siteIds, phaseId]
  );

  return allocations;
};

// NOTE: This should have stronger typing on `allocation`.
/**
 * Creates an allocation in the database
 * @param allocation Allocation data object
 * @param user User performing the operation
 * @returns DB operation result
 */
export const createAllocation = async (allocation, user: HcapUserInfo) => {
  const data = { ...allocation, created_by: user.id, updated_by: user.id };
  const res = await dbClient.db[collections.SITE_PHASE_ALLOCATION].insert(data);
  return res;
};

/**
 * Updates an allocation in the database
 * @param allocationId ID of allocation to edit
 * @param allocation Allocation data object
 * @param user User performing the operation
 * @returns DB operation result
 */
export const updateAllocation = async (allocationId: number, allocation, user: HcapUserInfo) => {
  const data = { ...allocation, updated_by: user.id };
  const res = await dbClient.db[collections.SITE_PHASE_ALLOCATION].update(allocationId, data);
  return res;
};

/**
 * Updates an allocation in the database
 * @param payload payload
 * @param user User performing the operation
 * @returns array of DB operation results
 */
export const createBulkAllocation = async (payload: bulkAllocationPayload, user: HcapUserInfo) => {
  const updateResults = [];
  const existingAllocations: Allocation[] = await getAllocationsForSites(
    payload.siteIds,
    payload.phase_id
  );
  await Promise.all(
    payload.siteIds.map(async (id) => {
      const allocationFound = existingAllocations.some(({ site_id }) => site_id === id);
      if (allocationFound) {
        existingAllocations.forEach(async (allocation) => {
          const data = {
            allocation: payload.allocation,
            phase_id: payload.phase_id,
            site_id: allocation.site_id,
          };
          updateResults.push(await updateAllocation(allocation.id, data, user));
        });
      } else {
        const data = {
          allocation: payload.allocation,
          phase_id: payload.phase_id,
          site_id: id,
        };
        updateResults.push(await createAllocation(data, user));
      }
    })
  );

  return updateResults;
};
