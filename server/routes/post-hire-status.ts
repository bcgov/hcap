import express from 'express';
import { asyncMiddleware, applyMiddleware } from '../error-handler';
import { ParticipantPostHireStatusSchema, validate } from '../validation';
import {
  createPostHireStatus,
  invalidatePostHireStatus,
  getPostHireStatus,
} from '../services/post-hire-flow';
import keycloak from '../keycloak';
import logger from '../logger';
import { getParticipantByID } from '../services/participants';
import { getAssignCohort } from '../services/cohorts';

const router = express.Router();

// Apply setup user middleware
router.use(applyMiddleware(keycloak.setupUserMiddleware()));

router.post(
  '/',
  applyMiddleware(keycloak.allowRolesMiddleware('health_authority', 'employer')),
  asyncMiddleware(async (req, res) => {
    const { user_id: userId, sub: localUserId } = req.user;
    const { body } = req;

    const user = userId || localUserId;
    // Validate the request body
    await validate(ParticipantPostHireStatusSchema, body);
    const { participantIds } = body;
    // Check participant exists
    const notParticipants: number[] = [];
    await Promise.all(
      participantIds.map(async (id) => {
        const [participant] = await getParticipantByID(id);
        if (!participant) notParticipants.push(id);
      })
    );

    if (notParticipants.length) {
      logger.error({
        action: 'post-hire-status_post',
        message: `Participant(s) do not exist with id ${JSON.stringify(notParticipants)}`,
      });

      return res
        .status(422)
        .send(
          `Participant(s) do not exist with id ${JSON.stringify(
            notParticipants
          )}. Please check participant ID`
        );
    }

    // Get Cohort
    const noCohorts: number[] = [];
    await Promise.all(
      participantIds.map(async (id) => {
        const cohorts = await getAssignCohort({ participantId: id });
        if (cohorts.length === 0) noCohorts.push(id);
      })
    );

    if (noCohorts.length) {
      logger.error({
        action: 'post-hire-status_post',
        message: `Cohort does not exist for participant with id ${JSON.stringify(noCohorts)}`,
      });

      return res
        .status(422)
        .send(
          `Cohort does not exist. Please assign a cohort to the participant with id ${JSON.stringify(
            noCohorts
          )}`
        );
    }

    // Save the record
    try {
      const results = [];
      await Promise.all(
        participantIds.map(async (id) => {
          await invalidatePostHireStatus({ ...body, participantId: id });
          results.push(await createPostHireStatus({ ...body, participantId: id }));
        })
      );
      logger.info({
        action: 'post-hire-status_post',
        performed_by: user,
      });
      return res.status(201).json(results);
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
    const [participant] = await getParticipantByID(participantId);
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

export default router;
