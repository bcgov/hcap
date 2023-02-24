import { participantStatus } from '../../constants';
import { getParticipantByID } from '../participants';
import { setParticipantStatus } from './set-status';
import type { HcapUserInfo } from '../../keycloak';

export const bulkEngageParticipants = async ({
  participants,
  user,
}: {
  participants;
  user: HcapUserInfo;
}) =>
  Promise.all(
    participants.map(async (id) => {
      const [participant] = await getParticipantByID(id);
      if (!participant) {
        return { participantId: id, status: 'not found', success: false };
      }

      const { status } = await setParticipantStatus(
        user.id,
        id,
        participantStatus.PROSPECTING,
        null,
        user
      );
      return {
        participantId: id,
        status,
        success: !['invalid_status_transition', 'invalid_archive'].includes(status),
      };
    })
  );
