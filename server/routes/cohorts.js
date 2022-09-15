const express = require('express');
const keycloak = require('../keycloak');
const logger = require('../logger.js');
const { asyncMiddleware, applyMiddleware } = require('../error-handler.js');
const {
  getCohorts,
  getCohort,
  assignCohort,
  getAssignCohort,
  updateCohort,
  getCountOfAllocation,
  getCohortParticipants,
  filterCohortParticipantsForUser,
} = require('../services/cohorts.js');
const { getParticipantByID } = require('../services/participants');
const { EditCohortSchema, validate } = require('../validation');

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

// Get cohort participants with their statuses
router.get(
  '/:id/participants',
  [applyMiddleware(keycloak.allowRolesMiddleware('health_authority', 'ministry_of_health'))],
  keycloak.getUserInfoMiddleware(),
  asyncMiddleware(async (req, res) => {
    const { user_id: userId, sub: localUserId } = req.user;
    const user = userId || localUserId;
    const cohortId = parseInt(req.params.id, 10);
    const cohortParticipants = await getCohortParticipants(cohortId);
    const filteredCohortParticipants = filterCohortParticipantsForUser(
      cohortParticipants,
      req.hcapUserInfo
    );
    logger.info({
      action: 'cohort_get',
      performed_by: {
        user,
      },
    });

    return res.status(200).json(filteredCohortParticipants);
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
      const [participant] = await getParticipantByID(participantId);
      if (!participant) {
        return res.status(400).send('Invalid participant id');
      }
      const [cohort] = await getCohort(+id);
      if (!cohort) {
        return res.status(400).send('Invalid cohort id');
      }
      const response = await assignCohort({ id: cohort.id, participantId: participant.id });
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

// Get Assigned cohort for participant
router.get(
  '/assigned-participant/:id',
  asyncMiddleware(async (req, res) => {
    const { user_id: userId, sub: localUserId } = req.user;
    const user = userId || localUserId;
    const { id } = req.params;
    if (!id) {
      return res.status(400).send('Participant id required');
    }
    const [participant] = await getParticipantByID(id);
    if (!participant) {
      return res.status(400).send('Invalid participant id');
    }
    const [cohort = {}] = (await getAssignCohort({ participantId: participant.id })) || [{}];
    logger.info({
      action: 'cohort_participant_get_assigned',
      performed_by: {
        user,
      },
      cohortId: cohort.id || '',
      participantId: participant.id,
    });
    return res.status(200).json(cohort);
  })
);

router.patch(
  '/:id',
  asyncMiddleware(async (req, res) => {
    const { email, user_id: userId, sub: localUserId } = req.user;
    if (email && (userId || localUserId)) {
      const { id } = req.params;
      const { body } = req;
      if (!id) {
        return res.status(400).send({ message: 'Missing cohort id' });
      }
      // Get Cohort
      const [cohort] = await getCohort(+id);
      if (!cohort) {
        return res.status(400).send({ message: 'Invalid cohort id' });
      }
      // Validate update body
      await validate(EditCohortSchema, body);

      // Validate cohort size with allocation
      const { cohortSize = 0 } = body;
      const allocation = await getCountOfAllocation({ cohortId: cohort.id });

      // Updated value is less than current allocation, so value is not accepted
      if (cohortSize < allocation) {
        return res.status(400).send({ message: 'Cohort size is less than current allocation' });
      }
      const response = await updateCohort(id, body);
      logger.info({
        action: 'psi-cohort_patch',
        performed_by: userId || localUserId,
        id: response !== undefined ? response.id : '',
      });
      return res.status(200).json(response);
    }
    return res.status(401).send('Unauthorized user');
  })
);

module.exports = router;
