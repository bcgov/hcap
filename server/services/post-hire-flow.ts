import { dbClient, collections } from '../db';
import { postHireStatuses } from '../constants';

interface HasParticipantId {
  participantId: number;
}

interface PostHireStatus extends HasParticipantId {
  status: postHireStatuses;
  data: {
    graduationDate?: string;
    unsuccessfulCohortDate?: string;
  };
}

export const invalidatePostHireStatus = async ({ participantId }: HasParticipantId) =>
  dbClient.db[collections.PARTICIPANT_POST_HIRE_STATUS].update(
    { participant_id: participantId },
    {
      is_current: false,
    }
  );

export const createPostHireStatus = async ({ participantId, status, data }: PostHireStatus) =>
  dbClient.db[collections.PARTICIPANT_POST_HIRE_STATUS].insert({
    participant_id: participantId,
    status,
    data,
  });

export const getPostHireStatusesForParticipant = async ({ participantId }: HasParticipantId) =>
  dbClient.db[collections.PARTICIPANT_POST_HIRE_STATUS].find(
    {
      participant_id: participantId,
    },
    {
      order: [{ field: 'created_at', direction: 'desc' }],
    }
  );

export const getPostHireStatusesForCohortParticipant = async (
  participantId: number,
  cohortId: number
) => {
  const statuses = await dbClient.db[collections.PARTICIPANT_POST_HIRE_STATUS]
    .join({
      cohortJoin: {
        relation: collections.COHORT_PARTICIPANTS,
        type: 'LEFT OUTER',
        on: {
          participant_id: 'participant_id',
          cohort_id: cohortId,
        },
      },
    })
    .find(
      {
        participant_id: participantId,
        'cohortJoin.id <>': null,
        is_current: true,
      },
      {
        order: [
          { field: `${collections.PARTICIPANT_POST_HIRE_STATUS}.created_at`, direction: 'DESC' },
        ],
      }
    );
  return statuses;
};

// Get the post-hire-status for the participant
export const getPostHireStatus = async (participantId: number, cohortId = -1) => {
  const statuses =
    cohortId !== -1
      ? await getPostHireStatusesForCohortParticipant(participantId, cohortId)
      : await getPostHireStatusesForParticipant({ participantId });
  return statuses;
};