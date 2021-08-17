const express = require('express');
const keycloak = require('../keycloak');
const logger = require('../logger.js');
const { asyncMiddleware, applyMiddleware } = require('../error-handler.js');
const { getCohorts, getCohort, assignCohort } = require('../services/cohorts.js');
const { getParticipantByID } = require('../services/participants');

// Router
const router = express.Router();

// Apply setup user middleware
router.use(applyMiddleware(keycloak.setupUserMiddleware()));
// Apply role middleware
router.use(
  applyMiddleware(
    keycloak.allowRolesMiddleware('ministry_of_health', 'health_authority', 'employer')
  )
);

// Get all cohorts
router.get(
  '/',
  asyncMiddleware(async (req, res) => {
    const { email, user_id: userId, sub: localUserId } = req.user;

    // our local deployment of keycloak holds the userId under the 'sub' key
    // rather than 'user_id'
    if (email && (userId || localUserId)) {
      const response = await getCohorts();
      logger.info('Get cohorts', {
        action: 'cohorts_get',
        performed_by: userId || localUserId,
        id: response.length > 0 ? response[0].id : '',
      });
      res.status(200).json(response);
    } else {
      res.status(401).send('Unauthorized user');
    }
  })
);

// Get one cohort with its id
router.get(
  '/:id',
  asyncMiddleware(async (req, res) => {
    const { user_id: userId, sub: localUserId } = req.user;
    const user = userId || localUserId;
    const id = parseInt(req.params.id, 10);
    const [cohort] = await getCohort(id);
    if (cohort === undefined) {
      return res.status(401).send({ message: 'You do not have permission to view this record' });
    }
    logger.info({
      action: 'cohort_get',
      performed_by: {
        user,
      },
      id: cohort.id || '',
    });

    return res.status(200).json(cohort);
  })
);

// Assign participant
router.post(
  '/:id/assign/:participantId',
  [applyMiddleware(keycloak.allowRolesMiddleware('health_authority', 'employer'))],
  asyncMiddleware(async (req, res) => {
    const { user_id: userId, sub: localUserId } = req.user;
    const user = userId || localUserId;
    const { id, participantId } = req.params;
    if (id && participantId) {
      const participant = await getParticipantByID(+participantId);
      if (!participant) {
        return res.status(400).send('Invalid participant id');
      }
      const cohort = await getCohort(+id);
      if (!cohort) {
        return res.status(400).send('Invalid cohort id');
      }
      const response = await assignCohort({ id, participantId });
      logger.info({
        action: 'cohort_participant_assign',
        performed_by: {
          user,
        },
        cohortId: cohort.id || '',
        participantId: participant.id,
      });
      return res.status(201).json(response);
    }
    return res.status(400).send('Cohort id and participant id required');
  })
);

module.exports = router;
