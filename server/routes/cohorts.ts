import express from 'express';
import { Role, UserRoles } from '../constants';
import keycloak from '../keycloak';
import logger from '../logger';
import { asyncMiddleware, applyMiddleware } from '../error-handler';
import {
  getCohorts,
  getCohort,
  assignCohort,
  getAssignCohort,
  updateCohort,
  getCountOfAllocation,
  getCohortParticipants,
  filterCohortParticipantsForUser,
  getCohortWithCalculatedFields,
  removeCohortParticipant,
} from '../services/cohorts';
import { getParticipantByID, getParticipantsToAssign } from '../services/participants';
import { EditCohortSchema, validate } from '../validation';

// Router
const router = express.Router();

// Apply setup user middleware
router.use(applyMiddleware(keycloak.setupUserMiddleware()));
// Apply role middleware
router.use(applyMiddleware(keycloak.allowRolesMiddleware(...UserRoles)));

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
  }),
);

// GET /participants-to-assign
router.get(
  '/participants-to-assign',
  [applyMiddleware(keycloak.allowRolesMiddleware(...UserRoles))],
  asyncMiddleware(async (req, res) => {
    const user = req.hcapUserInfo;
    const limit = parseInt(req.query.pageSize, 10) || 5;
    const offset = (parseInt(req.query.page, 10) || 0) * limit;
    const lastName = req.query.lastName || '';
    const emailAddress = req.query.emailAddress || '';
    try {
      const { participants, total } = await getParticipantsToAssign(
        limit,
        offset,
        lastName,
        emailAddress,
      );
      logger.info({
        action: 'get_participants_to_assign',
        performed_by: {
          user,
        },
      });
      return res.status(200).json({
        participants,
        total,
      });
    } catch (error) {
      logger.error('Failed to get participants to assign:', error);
      return res.status(500).send('Failed to get participants to assign');
    }
  }),
);

// Get one cohort with its id
router.get(
  '/:id',
  [applyMiddleware(keycloak.allowRolesMiddleware(Role.MinistryOfHealth, Role.HealthAuthority))],
  keycloak.getUserInfoMiddleware(),
  asyncMiddleware(async (req, res) => {
    const { user_id: userId, sub: localUserId } = req.user;
    const user = userId || localUserId;
    const id = parseInt(req.params.id, 10);
    const [cohort] = await getCohort(id);
    if (cohort === undefined) {
      return res.status(401).send({ message: 'You do not have permission to view this record' });
    }

    try {
      const cohortParticipants = await getCohortParticipants(id);

      const cohortWithCalculatedFields = getCohortWithCalculatedFields(cohort, cohortParticipants);

      const filteredCohortParticipants = filterCohortParticipantsForUser(
        cohortParticipants,
        req.hcapUserInfo,
      );

      logger.info({
        action: 'cohort_get',
        performed_by: {
          user,
        },
        id: cohort.id || '',
      });

      return res.status(200).json({
        cohort: cohortWithCalculatedFields,
        participants: filteredCohortParticipants,
      });
    } catch (err) {
      logger.error(`Cohort retrieval failed ${err.message}`, {
        context: 'cohort-controller',
        error: err,
      });
      throw err;
    }
  }),
);

// Assign participant
router.post(
  '/:id/assign/:participantId',
  [applyMiddleware(keycloak.allowRolesMiddleware(...UserRoles))],
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
  }),
);

// Transfer participant from current cohort to a new one
router.post(
  '/:id/assign/:participantId',
  [applyMiddleware(keycloak.allowRolesMiddleware(...UserRoles))],
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
  }),
);
// Transfer participant from current cohort to a new one - V2
router.post(
  '/:cohortId/transfer/:participantId/:newCohortId',
  [applyMiddleware(keycloak.allowRolesMiddleware(...UserRoles))],
  asyncMiddleware(async (req, res) => {
    const { user_id: userId, sub: localUserId } = req.user;
    const user = userId || localUserId;
    const { cohortId, participantId, newCohortId } = req.params;
    if (cohortId && participantId && newCohortId) {
      const [participant] = await getParticipantByID(participantId);
      if (!participant) {
        return res.status(400).send('Invalid participant id');
      }
      // Checking if current cohort is loaded
      const [oldCohort] = await getCohort(+cohortId);
      if (!oldCohort) {
        return res.status(400).send('Invalid cohort id - Current cohort');
      }
      // Checking if current cohort is loaded
      const [newCohort] = await getCohort(+newCohortId);
      if (!newCohort) {
        return res.status(400).send('Invalid cohort id - New cohort');
      }
      // Remove user from current cohort
      await removeCohortParticipant(oldCohort.id, participant.id);
      logger.info({
        action: 'cohort_participant_remove',
        performed_by: {
          user,
        },
        cohortId: oldCohort.id || '',
        participantId: participant.id,
      });
      // Assign participant to new cohort
      const response = await assignCohort({ id: newCohort.id, participantId: participant.id });
      logger.info({
        action: 'cohort_participant_assign',
        performed_by: {
          user,
        },
        cohortId: newCohort.id || '',
        participantId: participant.id,
      });
      return res.status(201).json(response);
    }
    return res.status(400).send('Cohorts id and participant id required');
  }),
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
  }),
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
  }),
);

// Remove participant from cohort
router.delete(
  '/:id/remove/:participantId',
  [applyMiddleware(keycloak.allowRolesMiddleware(...UserRoles))],
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
      await removeCohortParticipant(cohort.id, participant.id);
      logger.info({
        action: 'cohort_participant_remove',
        performed_by: {
          user,
        },
        cohortId: cohort.id || '',
        participantId: participant.id,
      });
      return res.status(200).json({ success: true, message: 'Participant removed successfully' });
    }
    return res.status(400).send('Cohort id and participant id required');
  }),
);

export default router;
