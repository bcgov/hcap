const express = require('express');
const keycloak = require('../keycloak');
const logger = require('../logger.js');
const { asyncMiddleware, applyMiddleware } = require('../error-handler.js');
const {
  getParticipantsForUser,
  getParticipantByIdWithStatus,
} = require('../services/participants');

// Router
const router = express.Router();

// Apply setup user middleware
router.use(applyMiddleware(keycloak.setupUserMiddleware()));
// Apply role middleware
router.use(applyMiddleware(keycloak.allowRolesMiddleware('participant')));

// Controller

// Participants
router.get(
  '/participants',
  asyncMiddleware(async (req, res) => {
    const { email, user_id: userId } = req.user;
    if (email && userId) {
      const response = await getParticipantsForUser(userId, email);
      logger.info({
        action: 'user_participants_get',
        performed_by: userId,
        id: response.length > 0 ? response[0].id : '',
      });
      res.status(200).json(response);
    } else {
      res.status(401).send('Unauthorized user');
    }
  })
);

// Participants
router.get(
  '/participant/:id',
  asyncMiddleware(async (req, resp) => {
    const { user_id: userId } = req.user;
    const { id } = req.params;
    const participants = await getParticipantByIdWithStatus({ id, userId });

    logger.info({
      action: 'user_participant_get',
      performed_by: userId,
      id: participants.length > 0 ? participants[0].id : '',
    });

    resp.status(200).json(participants);
  })
);

module.exports = router;
