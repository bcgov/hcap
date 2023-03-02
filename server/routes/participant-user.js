import express from 'express';
import keycloak from '../keycloak';
import logger from '../logger';
import { asyncMiddleware, applyMiddleware } from '../error-handler';
import {
  getParticipantsForUser,
  getParticipantByIdWithStatus,
  updateParticipant,
  createChangeHistory,
  setParticipantLastUpdated,
  withdrawParticipant,
  withdrawParticipantsByEmail,
} from '../services/participants';

import { patchObject, sanitize } from '../utils';

import { UserParticipantEditSchema, validate } from '../validation';
import { ParticipantStatus } from '../constants';

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
      res.status(401).send('Unauthorized user: no bcsc user id');
    }
  })
);

// Participants with id
router.get(
  '/participant/:id',
  asyncMiddleware(async (req, res) => {
    const { user_id: userId } = req.user;
    const { id } = req.params;
    const participants = await getParticipantByIdWithStatus({ id, userId });
    if (!participants.length) {
      return res.status(401).send({ message: 'You do not have permission to view this record' });
    }
    logger.info({
      action: 'user_participant_get',
      performed_by: {
        userId,
      },
      id: participants.length > 0 ? participants[0].id : '',
    });

    return res.status(200).json(participants);
  })
);

// Update user info
const patchableFields = [
  'phoneNumber',
  'postalCode',
  'postalCodeFsa',
  'isIndigenous',
  'indigenousIdentities',
];

router.patch(
  '/participant/batch',
  asyncMiddleware(async (req, res) => {
    const { user_id: userId, email } = req.user;

    const changes = { ...patchObject(req.body, patchableFields) };
    await validate(UserParticipantEditSchema, changes);

    // get users PEOIs
    const participants = await getParticipantsForUser(userId, email);

    if (participants.length > 0) {
      const updateResults = [];
      // Make batch updates
      await Promise.all(
        participants.map(async (participant) => {
          const participantBody = createChangeHistory(participant, changes);
          updateResults.push(await updateParticipant({ ...participantBody, id: participant.id }));
        })
      );

      logger.info({
        action: 'user_participant_batch_patch',
        performed_by: {
          userId,
        },
      });
      res.status(200).json(updateResults);
    } else {
      res.status(422).send(`No expression of interest found for this participant`);
    }
  })
);

router.patch(
  '/participant/:id',
  asyncMiddleware(async (req, res) => {
    const { user_id: userId } = req.user;
    const id = sanitize(req.params.id);
    const changes = { ...patchObject(req.body, patchableFields), id };
    await validate(UserParticipantEditSchema, changes);
    const participants = await getParticipantByIdWithStatus({ id, userId });
    if (participants.length > 0) {
      const participant = participants[0];
      const participantBody = createChangeHistory(participant.body, changes);
      const result = await updateParticipant({ ...participantBody, id });
      logger.info({
        action: 'user_participant_patch',
        performed_by: {
          userId,
        },
        id,
      });
      res.status(200).json(result);
    } else {
      res.status(422).send('No expression of interest found for this participant');
    }
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
        (statusObj) => statusObj.status === ParticipantStatus.HIRED
      );
      if (!isHired && !['no', 'withdrawn'].includes(participant.body?.interested)) {
        await withdrawParticipant({ ...participant.body, id });
        logger.info({
          action: 'user_participant_withdraw',
          performed_by: {
            userId,
          },
          id: participant.id,
        });
        res.status(200).send('OK');
      } else {
        res.status(422).send('Already Hired or Withdrawn');
      }
    } else {
      res.status(422).send('No expression of interest found for this participant');
    }
  })
);

router.post(
  '/withdraw',
  asyncMiddleware(async (req, res) => {
    await withdrawParticipantsByEmail(req.user.user_id, req.user.email);
    return res.status(204).send({});
  })
);

router.post(
  '/participant/:id/reconfirm_interest',
  asyncMiddleware(async (req, res) => {
    const { user_id: userId } = req.user;
    const { id } = req.params;
    const participants = await getParticipantByIdWithStatus({ id, userId });
    if (!participants.length) {
      return res.status(401).send({ message: 'You do not have permission to view this record' });
    }
    await setParticipantLastUpdated(id);
    logger.info({
      action: 'user_participant_reconfirm',
      performed_by: {
        userId,
      },
      id: participants.map((participant) => participant.id),
    });
    return res.status(201).send({ message: 'Reconfirm interest successful.' });
  })
);

export default router;
