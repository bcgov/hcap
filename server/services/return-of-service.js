const { dbClient, collections } = require('../db');
const { rosError } = require('../constants');

// Create
const makeReturnOfServiceStatus = async ({
  participantId,
  data,
  status = 'assigned-same-site',
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
  const { site } = statuses[0].data;

  // Get Site Id
  const sites = await dbClient.db[collections.EMPLOYER_SITES].find({
    'body.siteId': site,
  });
  if (sites.length === 0) {
    throw new Error(rosError.noSiteAttached);
  }
  const siteId = sites[0].id;

  // Save data
  return dbClient.db[collections.ROS_STATUS].insert({
    participant_id: participantId,
    site_id: siteId,
    data,
    status,
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
      },
      {
        order: [{ field: 'created_at', direction: 'desc' }],
      }
    );

module.exports = {
  makeReturnOfServiceStatus,
  getReturnOfServiceStatuses,
};
