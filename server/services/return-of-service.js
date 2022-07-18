/* eslint-disable camelcase */
const { dbClient, collections } = require('../db');
const { rosError } = require('../constants');

/**
 * Invalidate all ros statuses for participant
 * @param {*} param.db db transaction | optional database object
 * @param {*} param.participantId participant int | required participant id
 */
const invalidateReturnOfServiceStatus = async ({ db = null, participantId }) => {
  const dbObj = db || dbClient.db;
  await dbObj[collections.ROS_STATUS].update(
    {
      participant_id: participantId,
    },
    {
      is_current: false,
    }
  );
};

// Create
const makeReturnOfServiceStatus = async ({
  participantId,
  data,
  status = 'assigned-same-site',
  siteId,
  newSiteId,
  isUpdating = false,
}) => {
  // Get Site id from participant status
  const statuses = await dbClient.db[collections.PARTICIPANTS_STATUS].find({
    participant_id: participantId,
    status: 'hired',
    current: true,
  });
  if (statuses.length === 0) {
    throw new Error(rosError.participantNotHired);
  }

  // Handle site
  let site_id = siteId;
  if (!site_id) {
    const { site } = statuses[0].data;

    // Get Site Id
    const sites = await dbClient.db[collections.EMPLOYER_SITES].find({
      'body.siteId': site,
    });
    if (sites.length === 0) {
      throw new Error(rosError.noSiteAttached);
    }
    site_id = sites[0].id;
  }

  if (isUpdating) {
    const rosStatuses = await dbClient.db[collections.ROS_STATUS].find({
      participant_id: participantId,
      is_current: true,
    });

    const initialStartDate = rosStatuses?.[0]?.data?.date || data.startDate;
    // eslint-disable-next-line no-param-reassign
    data.date = initialStartDate;
  }

  return dbClient.db.withTransaction(async (tx) => {
    // Invalidate previous ros status
    await invalidateReturnOfServiceStatus({ db: tx, participantId });
    return tx[collections.ROS_STATUS].insert({
      participant_id: participantId,
      site_id: newSiteId || site_id,
      data,
      status,
      is_current: true,
    });
  });
};

const getReturnOfServiceStatuses = async ({ participantId }) =>
  dbClient.db[collections.ROS_STATUS]
    .join({
      site: {
        type: 'LEFT OUTER',
        decomposeTo: 'object',
        relation: collections.EMPLOYER_SITES,
        on: {
          id: 'site_id',
        },
      },
    })
    .find(
      {
        participant_id: participantId,
        is_current: true,
      },
      {
        order: [{ field: 'created_at', direction: 'desc' }],
      }
    );

module.exports = {
  makeReturnOfServiceStatus,
  getReturnOfServiceStatuses,
  invalidateReturnOfServiceStatus,
};
