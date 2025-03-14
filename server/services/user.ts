import _ from 'lodash';
import { dbClient, collections } from '../db';
import { HcapUserInfo } from '../keycloak';
import { dayjs } from '../utils';
import { ParticipantStatus as ps } from '../constants';
import { isPrivateEmployerOrMHSUEmployerOrHA } from './participants-helper';

export const userRegionQuery = (regions: string[], target: string) => {
  if (regions.length === 0) return null;
  return {
    or: regions.map((region) => ({ [`${target} ilike`]: `%${region}%` })),
  };
};

export const getUser = async (keycloakId: string) => {
  const query = { 'body.keycloakId': keycloakId };
  const user = await dbClient.db[collections.USERS].findOne(query);
  return user ? { ...user.body, id: user.id } : null;
};

/**
 * Returns all ROS statuses for given sites that are currently 'hired' (not archived) that started a year ago or more
 * @param sites
 * @returns [ROS_STATUS join to PARTICIPANTS_STATUS]
 */
const getROSEndedNotifications = async (sites: [id: number]) => {
  const todayDate = dayjs().utc().subtract(1, 'y').toDate().toUTCString();
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
      'data.date::timestamp <=': todayDate,
      is_current: true,
      'participantStatus.current': true,
      'participantStatus.status': ps.HIRED,
      'participantStatus.data.site': sites,
    });
};

/**
 * Returns an array of user notification objects
 * Where each notification has a message, severity, and type
 * Empty array for no notifications
 * @param hcapUserInfo
 * @returns {Promise<*[]>}
 */
export const getUserNotifications = async (
  hcapUserInfo: HcapUserInfo & { sites: [id: number] }
) => {
  const notifications = [];
  if (isPrivateEmployerOrMHSUEmployerOrHA(hcapUserInfo)) {
    const rosEndedNotifications = await getROSEndedNotifications(hcapUserInfo.sites);
    if (rosEndedNotifications.length > 0) {
      notifications.push({
        message: `You have a pending action: ${rosEndedNotifications.length} of your Return
        of Service Participants have finished their term. Please mark their outcomes.`,
        severity: 'warning',
        type: 'rosEnded',
      });
    }
  }
  return notifications;
};

export const getUserSites = async (id: string) => {
  const user = await getUser(id);
  if (!user || !user.sites) return [];
  return dbClient.db[collections.EMPLOYER_SITES].findDoc({
    siteId: user.sites.map((item) => item.toString()),
  });
};

export const getUserSiteIds = async (siteIds = []) =>
  dbClient.db[collections.EMPLOYER_SITES].findDoc({
    siteId: siteIds.map((item) => item.toString()),
  });

export const makeUser = async ({ keycloakId, sites }) => {
  await dbClient.db.saveDoc(collections.USERS, {
    keycloakId,
    sites,
  });
};

export const updateUserForMigration = async (id: string, { username, email }) => {
  await dbClient.db[collections.USER_MIGRATION].update({ id }, { username, email });
};

export const getUserMigrations = async () => {
  const sites = await dbClient.db[collections.EMPLOYER_SITES].find();
  const siteNames = _.chain(sites).mapKeys('body.siteId').mapValues('body.siteName').value();

  const users = await dbClient.db[collections.USER_MIGRATION]
    .join({
      userJoin: {
        type: 'LEFT',
        relation: collections.USERS,
        on: {
          'body.keycloakId': 'id::TEXT',
        },
      },
    })
    .find({ 'status !': 'complete' });

  return users.map((u) => ({
    id: u.id,
    username: u.username,
    email: u.email || '',
    roles: u.roles.join(', '),
    sites: u.userJoin?.[0]?.body.sites.map((siteId) => siteNames[siteId]).join(', ') || '',
  }));
};

export const getUserMigration = async (username: string, email: string) => {
  if (!username || !email) return null;

  const usernameCondition = username.includes('@bceid')
    ? `${username.split('@')[0]}@bceid%`
    : username;

  return dbClient.db[collections.USER_MIGRATION].findOne({
    'email ilike': email,
    'username ilike': usernameCondition,
  });
};
