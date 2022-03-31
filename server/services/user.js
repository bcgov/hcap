const { dbClient, collections } = require('../db');
const keycloak = require('../keycloak');
const logger = require('../logger');

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
  if (!user || !user.sites) return [];
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

const syncUser = async ({ log }) => {
  // Fetch all db users
  const allUsers = await dbClient.db[collections.USERS].findDoc();
  // Fetch all keycloak users
  const keycloakUsers = await keycloak.getUsers(true);
  // Sync
  const resp = await Promise.all(
    allUsers.map(async (user) => {
      const keycloakUser = keycloakUsers.find((item) => item.id === user.keycloakId);
      if (keycloakUser) {
        const { id, ...details } = keycloakUser;
        if (log) logger.info(`Syncing user ${user.id} and keycloak user ${id}`);
        return dbClient.db[collections.USERS].updateDoc(user.id, {
          userInfo: details,
        });
      }
      return user;
    })
  );
  return resp;
};

module.exports = {
  getUser,
  getUserSites,
  userRegionQuery,
  makeUser,
  syncUser,
};
