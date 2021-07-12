const express = require('express');
const keycloak = require('../keycloak');
const logger = require('../logger.js');
const { asyncMiddleware, applyMiddleware } = require('../error-handler.js');
const {
  getParticipantsForUser,
  getParticipantByIdWithStatus,
  withdrawParticipant,
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

// Participants with id
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

// Update withdraw
router.post(
  '/participant/:id/withdraw',
  asyncMiddleware(async (req, res) => {
    const { user_id: userId } = req.user;
    const { id } = req.params;
    const participants = await getParticipantByIdWithStatus({ id, userId });
    if (participants.length > 0) {
      const participant = participants[0];
      const isHired = participant.currentStatuses?.some(
        (statusObj) => statusObj.status === 'hired'
      );
      // eslint-disable-next-line  no-unused-vars
      const _ = isHired
        ? await withdrawParticipant(participant)
        : res.status(422).send('Already Hired');
      res.status(200).send('Success');
    } else {
      res.status(422).send(`No expression of interest with id: ${id}`);
    }
  })
);

module.exports = router;
