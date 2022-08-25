/* eslint-disable camelcase */
const { dbClient, collections } = require('../db');
const { rosError } = require('../constants');
const { getParticipantHiredStatuses } = require('./participant-status');
const logger = require('../logger.js');

const getRosParticipantStatus = async (participantId) => {
  const rosParticipantStatuses = await dbClient.db[collections.ROS_STATUS].find({
    participant_id: participantId,
    is_current: true,
  });
  if (rosParticipantStatuses.length === 0) {
    throw new Error(rosError.participantNotFound);
  }
  return rosParticipantStatuses[0];
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

const insertReturnOfServiceStatus = async ({ participantId, rosBody }) =>
  dbClient.db.withTransaction(async (tx) => {
    // Invalidate previous ros status
    await invalidateReturnOfServiceStatus({ db: tx, participantId });
    return tx[collections.ROS_STATUS].insert(rosBody);
  });

const createReturnOfServiceStatus = async ({
  participantId,
  data,
  siteId,
  status = 'assigned-same-site',
}) => {
  const statuses = await getParticipantHiredStatuses(participantId);
  let siteDbId = siteId;
  if (!siteDbId) {
    const { site } = statuses[0].data;
    siteDbId = await getDbSiteId(site);
  }
  const rosBody = {
    participant_id: participantId,
    site_id: siteDbId,
    is_current: true,
    status,
    data,
  };
  return insertReturnOfServiceStatus({ participantId, rosBody });
};

const updateReturnOfServiceStatus = async ({ participantId, data, user, status }) => {
  const rosParticipant = await getRosParticipantStatus(participantId);

  let siteDbId;
  if (data.site) {
    siteDbId = await getDbSiteId(data.site);
  }

  validateRosUpdateBody(rosParticipant, data.site, data.date, data.startDate);
  const updatedData = {
    ...rosParticipant.data,
    positionType: data.positionType || rosParticipant.data.positionType,
    employmentType: data.employmentType || rosParticipant.data.employmentType,
    date: data.date || rosParticipant.data.date,
    startDate: data.startDate || rosParticipant.data.startDate,
    user,
  };
  const rosBody = {
    participant_id: participantId,
    site_id: siteDbId || rosParticipant.site_id,
    is_current: true,
    status: status || rosParticipant.status,
    data: updatedData,
  };

  return insertReturnOfServiceStatus({ participantId, rosBody });
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

const logRosError = (actionName, err) => {
  logger.error({
    action: actionName,
    error: err.message,
  });
  const errMessage = getRosErrorMessage(err.message);
  return {
    status: errMessage.statusCode || 400,
    message: errMessage.label || 'Server error',
  };
};

module.exports = {
  createReturnOfServiceStatus,
  updateReturnOfServiceStatus,
  getReturnOfServiceStatuses,
  logRosError,
};
