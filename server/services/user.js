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

/**
 *
 * @param {*} hcapUserInfo
 * @returns
 */
const getUserNotifications = async (hcapUserInfo) => {
  const notifications = [];
  if (hcapUserInfo.isEmployer || hcapUserInfo.isHA) {
    const rosEndedNotifications = [
      {
        type: 'rosEnded',
        message: '2 of your Return of Service Participants have finished their term.',
      },
    ];
    notifications.push(rosEndedNotifications);
  }
  return notifications;
};

const getUserSites = async (id) => {
  const user = await getUser(id);
  if (!user || !user.sites) return [];
  return dbClient.db[collections.EMPLOYER_SITES].findDoc({
    siteId: user.sites.map((item) => item.toString()),
  });
};

const getUserSiteIds = async (siteIds = []) =>
  dbClient.db[collections.EMPLOYER_SITES].findDoc({
    siteId: siteIds.map((item) => item.toString()),
  });

const makeUser = async ({ keycloakId, sites }) => {
  await dbClient.db.saveDoc(collections.USERS, {
    keycloakId,
    sites,
  });
};

module.exports = {
  getUser,
  getUserSites,
  userRegionQuery,
  makeUser,
  getUserSiteIds,
  getUserNotifications,
};
