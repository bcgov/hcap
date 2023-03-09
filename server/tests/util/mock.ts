import { collections, dbClient } from '../../db';
import { EmployerSiteBatchSchema, validate } from '../../validators';

/**
 * Function to save multiple sites worth of mock data.
 * NOTE: this should probably be replaced with existing logic from in-use services as some point.
 * @param sitesArg Site or array of sites to save
 * @returns Array of responses
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const saveSites = async (sitesArg) => {
  const sites = Array.isArray(sitesArg) ? sitesArg : [sitesArg];
  await validate(EmployerSiteBatchSchema, sites);
  const promises = sites.map((site) => dbClient.db.saveDoc(collections.EMPLOYER_SITES, site));
  const results = await Promise.allSettled(promises);
  const response = [];
  results.forEach((result, index) => {
    const { siteId } = sites[index];
    if (result.status === 'fulfilled') {
      response.push({ siteId, status: 'Success' });
    } else if (result.reason.code === '23505') {
      response.push({ siteId, status: 'Duplicate' });
    } else {
      response.push({ siteId, status: 'Error', message: result.reason });
    }
  });
  return response;
};
