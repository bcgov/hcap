import { getParticipantByID } from './participants';
import logger from '../logger';

const validateParticipant = async (participantId, actionType) => {
  const [participant] = await getParticipantByID(participantId);
  if (!participant) {
    logger.error({
      action: actionType,
      message: `Participant ${participantId} not found`,
    });
    return undefined;
  }
  return participant;
};

const validateUser = async (user, actionType) => {
  const { email, user_id: userId, sub: localUserId } = user;
  const userData = userId || localUserId;

  if (!(email && userData)) {
    logger.error({
      action: actionType,
      message: `Unauthorized access`,
    });
    return undefined;
  }

  return userData;
};

export const validateCredentials = async (reqUser, participantId, actionType) => {
  const validUser = await validateUser(reqUser);
  if (!validUser) {
    return { isValid: false, status: 401, message: 'Unauthorized user', user: validUser };
  }
  const validParticipant = await validateParticipant(participantId, actionType);
  if (!validParticipant) {
    return {
      isValid: false,
      status: 404,
      message: 'Participant not found',
      user: validUser,
      participant: validParticipant,
    };
  }
  return { isValid: true, user: validUser, participant: validParticipant };
};
