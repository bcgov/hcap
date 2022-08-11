const express = require('express');
const keycloak = require('../keycloak');
const logger = require('../logger.js');
const { asyncMiddleware, applyMiddleware } = require('../error-handler.js');
const { rosError } = require('../constants');
const { CreateReturnOfServiceSchema, validate } = require('../validators');
const { getParticipantByID } = require('../services/participants');
const {
  makeReturnOfServiceStatus,
  getReturnOfServiceStatuses,
  updateReturnOfServiceStatus,
} = require('../services/return-of-service');
const { getSiteDetailsById, getDetailsBySiteId } = require('../services/employers');

const router = express.Router();

const validateParticipant = async (participantId, actionType) => {
  const [participant] = await getParticipantByID({ id: participantId });
  if (!participant) {
    logger.error({
      action: actionType,
      message: `Participant ${participantId} not found`,
    });
    return undefined;
  }
  return participant;
};

const validateUser = async (user, actionType) => {
  const { email, user_id: userId, sub: localUserId } = user;
  const userData = userId || localUserId;

  if (!(email && userData)) {
    logger.error({
      action: actionType,
      message: `Unauthorized access`,
    });
    return undefined;
  }

  return userData;
};

const validateCredentials = async (reqUser, participantId, actionType) => {
  const validUser = await validateUser(reqUser);
  if (!validUser) {
    return { isValid: false, status: 401, message: 'Unauthorized user', user: validUser };
  }
  const validParticipant = await validateParticipant(participantId, actionType);
  if (!validParticipant) {
    return {
      isValid: false,
      status: 404,
      message: 'Participant not found',
      user: validUser,
      participant: validParticipant,
    };
  }
  return { isValid: true, user: validUser, participant: validParticipant };
};

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

// Apply setup user middleware
router.use(applyMiddleware(keycloak.setupUserMiddleware()));

// Create a new return of service status
router.post(
  '/participant/:participantId',
  applyMiddleware(keycloak.allowRolesMiddleware('health_authority', 'employer')),
  asyncMiddleware(async (req, res) => {
    const actionName = 'ros-status-create';
    const { participantId } = req.params;
    const validationRes = await validateCredentials(req.user, participantId, actionName);
    if (!validationRes.isValid) {
      return res.status(validationRes.status).send(validationRes.message);
    }
    // Validate body
    await validate(CreateReturnOfServiceSchema, req.body);
    const { data, status, siteId, newSiteId, isUpdating } = req.body;

    if (siteId) {
      // Validate siteId
      const [site] = await getSiteDetailsById(siteId);
      if (site.error) {
        return res.status(404).send(`Site not found: ${site.error}`);
      }
    }

    const [newSite] = await getDetailsBySiteId(newSiteId);
    if (newSiteId) {
      if (newSite.error) {
        return res.status(404).send(`Site not found: ${newSite.error}`);
      }
    }

    try {
      const response = await makeReturnOfServiceStatus({
        participantId: validationRes.participant?.id,
        data,
        status,
        siteId,
        newSiteId: newSite?.id,
        isUpdating,
      });
      logger.info({
        action: actionName,
        performed_by: validationRes.user,
        id: response.id,
      });
      return res.status(201).json(response);
    } catch (error) {
      logger.error({
        action: actionName,
        error: error.message,
      });
      const errMessage = getRosErrorMessage(error.message);
      return res.status(errMessage.statusCode || 400).send(errMessage.label || 'Server error');
    }
  })
);

// Get return of service status for participant
router.get(
  '/participant/:participantId',
  applyMiddleware(
    keycloak.allowRolesMiddleware('ministry_of_health', 'health_authority', 'employer')
  ),
  asyncMiddleware(async (req, res) => {
    const actionName = 'ros-status-get';
    const { participantId } = req.params;
    const validationRes = await validateCredentials(req.user, participantId, actionName);
    if (!validationRes.isValid) {
      return res.status(validationRes.status).send(validationRes.message);
    }
    const resp = await getReturnOfServiceStatuses({ participantId });
    logger.info({
      action: actionName,
      performed_by: validationRes.user,
      ids: resp.map((r) => r.id),
    });
    return res.status(200).json(resp);
  })
);

// Update return of service fields
router.patch(
  '/participant/:participantId',
  applyMiddleware(keycloak.allowRolesMiddleware('ministry_of_health')),
  asyncMiddleware(async (req, res) => {
    const actionName = 'ros-status-update';
    const { participantId } = req.params;
    const validationRes = await validateCredentials(req.user, participantId, actionName);
    if (!validationRes.isValid) {
      return res.status(validationRes.status).send(validationRes.message);
    }
    const { startDate, date, site } = req.body;
    if (!startDate && !date && !site) {
      throw new Error(rosError.noFieldsToUpdate);
    }

    try {
      const response = await updateReturnOfServiceStatus({
        participantId,
        newSite: site,
        newDate: date,
        newStartDate: startDate,
        user: validationRes.user,
      });
      logger.info({
        action: actionName,
        performed_by: validationRes.user,
        id: response?.id,
      });
      return res.status(200).json(response);
    } catch (error) {
      logger.error({
        action: actionName,
        error: error.message,
      });
      const errMessage = getRosErrorMessage(error.message);
      return res.status(errMessage.statusCode || 400).send(errMessage.label || 'Server error');
    }
  })
);

module.exports = router;
