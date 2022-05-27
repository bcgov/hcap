const express = require('express');
const { asyncMiddleware, applyMiddleware } = require('../error-handler.js');
const { ParticipantPostHireStatusSchema, validate } = require('../validation');
const {
  createPostHireStatus,
  updatePostHireStatus,
  getPostHireStatus,
} = require('../services/post-hire-flow');
const keycloak = require('../keycloak');
const logger = require('../logger.js');
const { getParticipantByID } = require('../services/participants.js');
const { getAssignCohort } = require('../services/cohorts.js');

const router = express.Router();

// Apply setup user middleware
router.use(applyMiddleware(keycloak.setupUserMiddleware()));

router.post(
  '/',
  applyMiddleware(keycloak.allowRolesMiddleware('health_authority')),
  asyncMiddleware(async (req, res) => {
    const { user_id: userId, sub: localUserId } = req.user;
    const { body } = req;

    const user = userId || localUserId;
    // Validate the request body
    await validate(ParticipantPostHireStatusSchema, body);
    const { participantId } = body;
    // Check participant exists
    const participant = await getParticipantByID(participantId);
    if (!participant) {
      logger.error({
        action: 'post-hire-status_post',
        message: `Participant does not exist with id ${participantId}`,
      });
      return res.status(422).send('Participant does not exist. Please check participant ID');
    }

    // Get Cohort
    const cohorts = await getAssignCohort({ participantId });
    if (cohorts.length === 0) {
      logger.error({
        action: 'post-hire-status_post',
        message: `Cohort does not exist for participant with id ${participantId}`,
      });

      return res
        .status(422)
        .send('Cohort does not exist. Please assign a cohort to the participant');
    }

    // Save the record
    try {
      await updatePostHireStatus(body);
      const result = await createPostHireStatus(body);

      logger.info({
        action: 'post-hire-status_post',
        performed_by: user,
        id: result !== undefined ? result.id : '',
      });
      return res.status(201).json(result);
    } catch (e) {
      logger.error(e);
      return res.status(500).json({});
    }
  })
);

router.get(
  '/participant/:participantId',
  applyMiddleware(
    keycloak.allowRolesMiddleware('health_authority', 'ministry_of_health', 'employer')
  ),
  asyncMiddleware(async (req, res) => {
    const { user_id: userId, sub: localUserId } = req.user;
    const user = userId || localUserId;
    const { participantId } = req.params;
    // Check if the participant exists
    const participant = await getParticipantByID(participantId);
    const cohorts = await getAssignCohort({ participantId });
    if (!participant) {
      return res.status(404).send('Participant not found');
    }

    const cohortId = !cohorts || cohorts.length < 1 ? -1 : cohorts[0].id;
    const result = await getPostHireStatus(participantId, cohortId);
    logger.info({
      action: 'post-hire-status_get',
      performed_by: user,
      participantId,
      ids: result.map((item) => item.id),
    });
    return res.status(200).json(result);
  })
);

module.exports = router;
