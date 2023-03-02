/* eslint-disable camelcase */
import { HcapUserInfo } from '../keycloak';

// disabling camelcase check so that we can manipulate snake_case attributes without changing structure
const { dbClient, collections } = require('../db');

/**
 * Gets all phases for a site
 * @param siteId PK ID of the site
 * @param phaseId PK ID of the phase
 */
export const getAllocation = async (siteId: number, phaseId: number) => {
  /** Type for DB response to the `getAllocation` query */
  type AllocationResponse = {
    /** PK ID of the allocation */
    id: number;
    /** FK for phase */
    phase_id: number;
    /** Number of allocations available */
    allocation: number;
    /** FK for employer_site */
    site_id: number;
  };

  const allocation: AllocationResponse = await dbClient.db[
    collections.SITE_PHASE_ALLOCATION
  ].findOne({
    site_id: siteId,
    phase_id: phaseId,
  });

  return allocation;
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

// export const createBulkAllocation = async (payload: any, user: HcapUserInfo) => {
//   payload.siteIds.map((id) => {
//     const data = {
//       allocation: payload.allocation,
//       phase_id: payload.phase.id,
//       site_id: id,
//     };

//     return createAllocation(data, user);
//   });
//   // const res = await dbClient.db[collections.SITE_PHASE_ALLOCATION].insert(data);
//   // return res;
// };
