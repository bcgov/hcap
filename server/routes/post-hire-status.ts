/* eslint-disable camelcase */
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
import { postHireStatuses, Role, UserRoles } from '../constants';

const router = express.Router();

type postHireStatusBody = {
  body: {
    /** participant IDs getting their post hire status set/updated */
    participantIds: number[];
    /**  String representing the status */
    status: postHireStatuses;
    data: {
      /** Date set If status = successful */
      graduationDate?: string;
      /** Date set If status = unsuccessful */
      unsuccessfulCohortDate?: string;
    };
  };
  /** User setting the status */
  user: {
    /** User id from keycloak */
    user_id: string;
    /** Additional user id from keycloak */
    sub: string;
  };
};

// Apply setup user middleware
router.use(applyMiddleware(keycloak.setupUserMiddleware()));

router.post(
  '/',
  applyMiddleware(keycloak.allowRolesMiddleware(Role.HealthAuthority, Role.Employer)),
  asyncMiddleware(async (req: postHireStatusBody, res) => {
    const { user_id: userId, sub: localUserId } = req.user;
    const { body } = req;

    const user = userId || localUserId;
    // Validate the request body
    await validate(ParticipantPostHireStatusSchema, body);
    const { participantIds } = body;

    const notParticipants: {
      id: number;
      valid: boolean;
    }[] = (
      await Promise.all(
        participantIds.map(async (id) => ({ id, valid: (await getParticipantByID(id)).length > 0 }))
      )
    ).filter(({ valid }) => !valid);

    if (notParticipants.length) {
      logger.error({
        action: 'post-hire-status_post',
        message: `Participant(s) do not exist with id ${JSON.stringify(
          notParticipants.map(({ id }) => id)
        )}`,
      });

      return res
        .status(422)
        .send(
          `Participant(s) do not exist with id ${JSON.stringify(
            notParticipants.map(({ id }) => id)
          )}. Please check participant ID`
        );
    }

    const noCohorts: {
      id: number;
      valid: boolean;
    }[] = (
      await Promise.all(
        participantIds.map(async (id) => ({
          id,
          valid: (await getAssignCohort({ participantId: id })).length > 0,
        }))
      )
    ).filter(({ valid }) => !valid);

    if (noCohorts.length) {
      logger.error({
        action: 'post-hire-status_post',
        message: `Cohort does not exist for participant with id ${JSON.stringify(
          noCohorts.map(({ id }) => id)
        )}`,
      });

      return res
        .status(422)
        .send(
          `Cohort does not exist. Please assign a cohort to the participant with id ${JSON.stringify(
            noCohorts.map(({ id }) => id)
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
  applyMiddleware(keycloak.allowRolesMiddleware(...UserRoles)),
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
