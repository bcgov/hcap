/* eslint-disable camelcase */
const { dbClient, collections } = require('../db');
const { rosError } = require('../constants');

const getParticipantStatuses = async (participantId) => {
  const statuses = await dbClient.db[collections.PARTICIPANTS_STATUS].find({
    participant_id: participantId,
    status: 'hired',
    current: true,
  });
  if (statuses.length === 0) {
    throw new Error(rosError.participantNotHired);
  }
  return statuses;
};

const getRosParticipant = async (participantId) => {
  const rosParticipants = await dbClient.db[collections.ROS_STATUS].find({
    participant_id: participantId,
    is_current: true,
  });
  if (rosParticipants.length === 0) {
    throw new Error(rosError.participantNotFound);
  }
  return rosParticipants[0];
};

const getDbSiteId = async (site) => {
  const sites = await dbClient.db[collections.EMPLOYER_SITES].find({
    'body.siteId': site,
  });
  if (sites.length === 0) {
    throw new Error(rosError.noSiteAttached);
  }
  return sites[0].id;
};

const validateRosUpdateBody = (rosParticipant, updatedSite, updatedDate, updatedStartDate) => {
  if (!rosParticipant.data) {
    throw new Error(rosError.fieldNotFound);
  }
  if (!updatedSite && !updatedDate && !updatedStartDate) {
    throw new Error(rosError.noFieldsToUpdate);
  }
  if (updatedSite && !rosParticipant.site_id) {
    throw new Error(rosError.noSiteAttached);
  }
  if (updatedDate && !rosParticipant.data.date) {
    throw new Error(rosError.noDate);
  }
  if (updatedStartDate && !rosParticipant.data.startDate) {
    throw new Error(rosError.noStartDate);
  }
};

const formatEditRosData = async (
  participantId,
  updatedSite,
  updatedDate,
  updatedStartDate,
  user
) => {
  const rosParticipant = await getRosParticipant(participantId);
  validateRosUpdateBody(rosParticipant, updatedSite, updatedDate, updatedStartDate);
  let site_id;
  if (updatedSite) {
    site_id = await getDbSiteId(updatedSite);
  }

  return {
    participant_id: participantId,
    site_id: site_id || rosParticipant.site_id,
    status: rosParticipant.status,
    data: {
      ...rosParticipant.data,
      date: updatedDate || rosParticipant.data.date,
      startDate: updatedStartDate || rosParticipant.data.startDate,
      user,
      isEntryEditedByMoh: true,
    },
    is_current: true,
  };
};

const formatCreateRosData = async (
  participantId,
  siteId,
  assignNewSite,
  data,
  newSiteId,
  status
) => {
  const statuses = await getParticipantStatuses(participantId);
  let site_id = siteId;
  if (!site_id) {
    const { site } = statuses[0].data;
    site_id = await getDbSiteId(site);
  }

  if (assignNewSite) {
    const rosParticipant = await getRosParticipant(participantId);
    // eslint-disable-next-line no-param-reassign
    data.date = rosParticipant.data?.date || data.startDate;
  }

  return {
    participant_id: participantId,
    site_id: newSiteId || site_id,
    data,
    status,
    is_current: true,
  };
};

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
  siteId,
  newSiteId,
  status = 'assigned-same-site',
  assignNewSite = false,
}) => {
  const rosBody = await formatCreateRosData(
    participantId,
    siteId,
    assignNewSite,
    data,
    newSiteId,
    status
  );

  return dbClient.db.withTransaction(async (tx) => {
    // Invalidate previous ros status
    await invalidateReturnOfServiceStatus({ db: tx, participantId });
    return tx[collections.ROS_STATUS].insert(rosBody);
  });
};

const updateReturnOfServiceStatus = async ({ participantId, data, user }) => {
  const rosBody = await formatEditRosData(
    participantId,
    data.site,
    data.date,
    data.startDate,
    user
  );

  return dbClient.db.withTransaction(async (tx) => {
    // Invalidate previous ros status
    await invalidateReturnOfServiceStatus({ db: tx, participantId });
    return tx[collections.ROS_STATUS].insert(rosBody);
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

const getRosErrorMessage = (messageType) => {
  switch (messageType) {
    case rosError.participantNotHired:
      return { label: 'Participant is not hired', statusCode: 400 };
    case rosError.noSiteAttached:
      return { label: 'Return of service site is not recorded', statusCode: 400 };
    case rosError.participantNotFound:
      return { label: 'Participant does not have a return of service record', statusCode: 400 };
    case rosError.fieldNotFound:
      return { label: 'Unable to parse field value to update', statusCode: 400 };
    case rosError.noFieldsToUpdate:
      return { label: 'Unable to update: no changes found', statusCode: 400 };
    case rosError.noDate:
      return { label: 'Start date is not recorded', statusCode: 400 };
    case rosError.noStartDate:
      return { label: 'Start date at a new site is not recorded', statusCode: 400 };
    default:
      return {
        text: 'Internal server error: unable to create return of service status',
        statusCode: 500,
      };
  }
};

module.exports = {
  makeReturnOfServiceStatus,
  updateReturnOfServiceStatus,
  getReturnOfServiceStatuses,
  invalidateReturnOfServiceStatus,
  getRosErrorMessage,
};
