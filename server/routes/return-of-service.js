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
} = require('../services/return-of-service');

const router = express.Router();

// Apply setup user middleware
router.use(applyMiddleware(keycloak.setupUserMiddleware()));

// Create a new return of service status
router.post(
  '/participant/:participantId',
  applyMiddleware(keycloak.allowRolesMiddleware('health_authority', 'employer')),
  asyncMiddleware(async (req, res) => {
    const { participantId } = req.params;
    const { email, user_id: userId, sub: localUserId } = req.user;
    const user = userId || localUserId;
    if (!(email && user)) {
      return res.status(401).send('Unauthorized user');
    }
    // Validate body
    await validate(CreateReturnOfServiceSchema, req.body);
    // Validate Participant
    const [participant] = await getParticipantByID({ id: participantId });
    if (!participant) {
      logger.error({
        action: 'ros-status-create',
        message: `Participant ${participantId} not found`,
      });
      return res.status(404).send('Participant not found');
    }
    const { data, status } = req.body;
    try {
      const response = await makeReturnOfServiceStatus({
        participantId: participant.id,
        data,
        status,
      });
      logger.info({
        action: 'ros-status-create',
        performed_by: user,
        id: response.id,
      });
      return res.status(201).json(response);
    } catch (error) {
      logger.error({
        action: 'ros-status-create',
        error: error.message,
      });
      switch (error.message) {
        case rosError.participantNotHired:
          return res.status(400).send('Participant is not hired');
        case rosError.noSiteAttached:
          return res.status(400).send('Participant is not attached to a site');
        default:
          return res
            .status(500)
            .send(
              `Internal server error: unable to create return of service status (${error.message})`
            );
      }
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
    const { participantId } = req.params;
    const { email, user_id: userId, sub: localUserId } = req.user;
    const user = userId || localUserId;
    if (!(email && user)) {
      return res.status(401).send('Unauthorized user');
    }
    // Validate Participant
    const [participant] = await getParticipantByID({ id: participantId });
    if (!participant) {
      logger.error({
        action: 'ros-status-create',
        message: `Participant ${participantId} not found`,
      });
      return res.status(404).send('Participant not found');
    }
    const resp = await getReturnOfServiceStatuses({ participantId });
    logger.info({
      action: 'ros-status-get',
      performed_by: user,
      ids: resp.map((r) => r.id),
    });
    return res.status(200).json(resp);
  })
);

module.exports = router;
