const { dbClient, collections } = require('../db');

const userRegionQuery = (regions, target) => {
  if (regions.length === 0) return null;
  return {
    or: regions.map((region) => ({ [`${target} ilike`]: `%${region}%` })),
  };
};

const getUser = async (id) => {
  const query = { keycloakId: id };
  const options = { single: true };
  return dbClient.db[collections.USERS].findDoc(query, options);
};

const getUserSites = async (id) => {
  const user = await getUser(id);
  return dbClient.db[collections.EMPLOYER_SITES].findDoc({
    siteId: user.sites.map((item) => item.toString()),
  });
};

const makeUser = async ({ keycloakId, sites }) => {
  await dbClient.db.saveDoc(collections.USERS, {
    keycloakId,
    sites,
  });
};

module.exports = {
  getUser, getUserSites, userRegionQuery, makeUser,
};
