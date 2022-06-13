const dayjs = require('dayjs');
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
 * Returns all ROS statuses for given sites that are currently 'hired' (not archived) that started a year ago or more
 * @param {[id: number]} sites
 * @returns [ROS_STATUS join to PARTICIPANTS_STATUS]
 */
const getROSEndedNotifications = async (sites) => {
  const todayDate = dayjs(new Date()).subtract(1, 'y').format('YYYY-MM-DD');
  return dbClient.db[collections.ROS_STATUS]
    .join({
      participantStatus: {
        relation: collections.PARTICIPANTS_STATUS,
        type: 'LEFT OUTER',
        on: {
          participant_id: 'participant_id',
        },
      },
    })
    .find({
      and: [
        { 'data.date::timestamp <': todayDate },
        { 'participantStatus.current': true },
        { 'participantStatus.status': 'hired' },
        { 'participantStatus.data.site': sites },
      ],
    });
};

/**
 * Returns an object of user notifications with keys being the type of notification
 * Empty object for no notifications, keys correspond to notification type they have
 * @param {*} hcapUserInfo
 * @returns {}
 */
const getUserNotifications = async (hcapUserInfo) => {
  const notifications = {};
  if (hcapUserInfo.isEmployer || hcapUserInfo.isHA) {
    const rosEndedNotifications = await getROSEndedNotifications(hcapUserInfo.sites);
    if (rosEndedNotifications.length > 0) {
      notifications.rosEndedNotifications = rosEndedNotifications;
    }
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
