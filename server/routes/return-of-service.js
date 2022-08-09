const express = require('express');
const keycloak = require('../keycloak');
const logger = require('../logger.js');
const { asyncMiddleware, applyMiddleware } = require('../error-handler.js');
const { rosError, rosFieldUpdate } = require('../constants');
const { CreateReturnOfServiceSchema, validate } = require('../validators');
const { getParticipantByID } = require('../services/participants');
const {
  makeReturnOfServiceStatus,
  getReturnOfServiceStatuses,
  updateReturnOfServiceSite,
  updateReturnOfServiceDate,
  updateReturnOfServiceStartDate,
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
    return null;
  }
  return participant;
};

const getRosErrorMessage = (message) => {
  switch (message) {
    case rosError.participantNotHired:
      return { label: 'Participant is not hired', statusCode: 400 };
    case rosError.noSiteAttached:
      return { label: 'Participant is not attached to a site', statusCode: 400 };
    case rosError.participantNotFound:
      return { label: 'Participant does not have a return of service record', statusCode: 400 };
    case rosError.fieldNotFound:
      return { label: 'Unable to parse field value to update', statusCode: 400 };
    default:
      return {
        text: `Internal server error: unable to create return of service status (${message})`,
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
    const { email, user_id: userId, sub: localUserId } = req.user;
    const user = userId || localUserId;
    if (!(email && user)) {
      return res.status(401).send('Unauthorized user');
    }
    // Validate body
    await validate(CreateReturnOfServiceSchema, req.body);
    // Validate Participant
    const participant = await validateParticipant(participantId, actionName);
    if (!participant) {
      return res.status(404).send('Participant not found');
    }
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
        participantId: participant.id,
        data,
        status,
        siteId,
        newSiteId: newSite?.id,
        isUpdating,
      });
      logger.info({
        action: actionName,
        performed_by: user,
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
    const { email, user_id: userId, sub: localUserId } = req.user;
    const user = userId || localUserId;
    if (!(email && user)) {
      return res.status(401).send('Unauthorized user');
    }
    const participant = await validateParticipant(participantId, actionName);
    if (!participant) {
      return res.status(404).send('Participant not found');
    }
    const resp = await getReturnOfServiceStatuses({ participantId });
    logger.info({
      action: actionName,
      performed_by: user,
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
    const { email, user_id: userId, sub: localUserId } = req.user;
    const user = userId || localUserId;
    if (!(email && user)) {
      return res.status(401).send('Unauthorized user');
    }
    const participant = await validateParticipant(participantId, actionName);
    if (!participant) {
      return res.status(404).send('Participant not found');
    }
    const { newValue, fieldType } = req.body;

    try {
      let response;
      switch (fieldType) {
        case rosFieldUpdate.siteId:
          response = await updateReturnOfServiceSite({
            participantId: participant.id,
            newSiteId: newValue,
          });
          break;

        case rosFieldUpdate.date:
          response = await updateReturnOfServiceDate({
            participantId: participant.id,
            newDate: newValue,
          });
          break;

        case rosFieldUpdate.startDate:
          response = await updateReturnOfServiceStartDate({
            participantId: participant.id,
            newStartDate: newValue,
          });
          break;

        default:
          throw new Error(rosError.fieldNotFound);
      }

      logger.info({
        action: actionName,
        performed_by: user,
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

module.exports = router;
