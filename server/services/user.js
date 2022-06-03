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
 *
 * @param {*} hcapUserInfo
 * @returns
 */
const getUserNotifications = async (hcapUserInfo) => {
  const notifications = [];
  if (hcapUserInfo.isEmployer || hcapUserInfo.isHA) {
    const date = dayjs(new Date('2022-05-15')).format('YYYY-MM-DD');
    const criteria = {
      and: [
        { site_id: hcapUserInfo.sites },
        { 'data.date::timestamp <': date },
        { 'participantStatus.current': true },
        { 'participantStatus.status': 'hired' },
      ],
    };
    const join = {
      participantStatus: {
        relation: collections.PARTICIPANTS_STATUS,
        type: 'LEFT OUTER',
        on: {
          participant_id: 'participant_id',
        },
      },
    };
    try {
      const rosEndedNotifications = await dbClient.db[collections.ROS_STATUS]
        .join(join)
        .find(criteria);
      notifications.push(rosEndedNotifications);
    } catch (err) {
      console.log(err);
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
