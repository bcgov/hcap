import { UUID } from 'massive';
import { dbClient, collections } from '../db';
import { participantStatus } from '../constants';
import { withdrawParticipant, getParticipantByID, invalidateStatus } from './participants';
import { HcapUserInfo } from '../keycloak';

const {
  PROSPECTING,
  INTERVIEWING,
  OFFER_MADE,
  HIRED,
  ARCHIVED,
  INVALID_STATUS,
  REJECTED,
  INVALID_STATUS_TRANSITION,
  PENDING_ACKNOWLEDGEMENT,
  INVALID_ARCHIVE,
  ALREADY_HIRED,
  REJECT_ACKNOWLEDGEMENT,
} = participantStatus;

const previousStatusesMap = {
  [PROSPECTING]: [null, REJECTED],
  [INTERVIEWING]: [PROSPECTING],
  [OFFER_MADE]: [INTERVIEWING],
  [HIRED]: [OFFER_MADE],
  [ARCHIVED]: [HIRED],
  [REJECTED]: [OFFER_MADE, INTERVIEWING, PROSPECTING, REJECT_ACKNOWLEDGEMENT],
};

// Helper
/**
 * Invalidate all current status for site
 * @param db Database object
 * @param options
 * @param options.site string | number Site ID
 * @param options.participantId  string | number Participant ID string
 * @returns
 */
const invalidateAllStatusForSite = async (
  db,
  { site, participantId }: { site: string | number; participantId: string | number }
) => {
  if (!db) {
    return;
  }
  await db[collections.PARTICIPANTS_STATUS].update(
    {
      participant_id: participantId,
      current: true,
      'data.site': site,
    },
    {
      current: false,
    }
  );
};

/**
 *
 * @param employerId Employer ID
 * @param participantId Participant ID
 * @param status Status
 * @param data Data object
 * @param user User object
 * @param currentStatusId New status transition reference ID
 * @returns
 */
export const setParticipantStatus = async (
  employerId: string | UUID,
  participantId: string | UUID,
  status: string,
  data, // JSONB on the status row
  user: { isEmployer?: boolean; sites?: number[]; id?: string } = {
    isEmployer: true,
    sites: [],
    id: employerId,
  },
  currentStatusId: string | number = null
) =>
  dbClient.db.withTransaction(async (tx) => {
    // No creation of status PENDING_ACKNOWLEDGEMENT/REJECT_ACKNOWLEDGEMENT to any other status
    if ([PENDING_ACKNOWLEDGEMENT, REJECT_ACKNOWLEDGEMENT].includes(status))
      return { status: INVALID_STATUS };

    // Load hired status
    const hiredStatusItems =
      (await tx[collections.PARTICIPANTS_STATUS].find({
        participant_id: participantId,
        status: HIRED,
        current: true,
      })) || [];

    // No Status transition from HIRED to any other status except ARCHIVED or REJECTED
    if (hiredStatusItems.length && ![ARCHIVED, REJECTED].includes(status)) {
      return { status: ALREADY_HIRED };
    }

    // Getting site
    const { site } = data || {};

    // Additional Info to save
    let additional = {};

    // ROS complete status check
    const isRosComplete = data?.type === 'rosComplete';

    // Getting current participant status with context of employer
    const existingCurrentStatus = currentStatusId
      ? await tx[collections.PARTICIPANTS_STATUS].findOne({ id: currentStatusId })
      : await tx[collections.PARTICIPANTS_STATUS].findOne({
          participant_id: participantId,
          current: true,
          employer_id: employerId,
        });

    // If existing status if not current, then invalid status transition
    if (existingCurrentStatus && !existingCurrentStatus.current) {
      return { status: INVALID_STATUS_TRANSITION, currentStatus: existingCurrentStatus };
    }

    // Check validity of status transition
    const currentStatus = existingCurrentStatus?.status || null;
    const validPreviousStatuses = previousStatusesMap[status] || [];
    if (!validPreviousStatuses.includes(currentStatus)) {
      return {
        status: INVALID_STATUS_TRANSITION,
        currentStatus,
        newStatus: status,
        existingCurrentStatus,
      };
    }

    // Load Participant
    const participant = await tx[collections.PARTICIPANTS].findDoc({
      id: participantId,
    });

    // Ignore existingStatus invalidation
    let ignoreStatusInvalidation = false;
    // Handle individual status transitions
    switch (status) {
      case ARCHIVED: {
        // No Previous Hire Status
        if (!hiredStatusItems.length) {
          return { status: INVALID_ARCHIVE, reason: 'Not Hired' };
        }

        const hiredStatus = hiredStatusItems[0];

        // Check previously archived or not
        const previousArchived = await tx[collections.PARTICIPANTS_STATUS].findOne({
          participant_id: participantId,
          status: ARCHIVED,
        });

        if (previousArchived) {
          return { status: INVALID_ARCHIVE, previousArchived };
        }

        // Hire Status owner is not same employer or peer
        if (
          hiredStatus.employer_id !== employerId &&
          !user.sites.includes(hiredStatus.data?.site)
        ) {
          return { status: INVALID_ARCHIVE };
        }

        // Participant hired by other employer
        if (hiredStatus.employer_id !== employerId) {
          // Add an ephemeral status to warn the employer
          await tx[collections.PARTICIPANTS_STATUS].save({
            employer_id: hiredStatus.employer_id,
            participant_id: participantId,
            status: PENDING_ACKNOWLEDGEMENT,
            current: true,
            data,
          });
        }

        // Invalidate all current statuses for site
        await invalidateAllStatusForSite(tx, { site, participantId });

        // Withdraw participant from program
        if (!isRosComplete) {
          await withdrawParticipant(participant[0]);
        }

        break;
      }
      case HIRED: {
        // If no previous status with site or previous status site mismatch
        if (existingCurrentStatus.data?.site && existingCurrentStatus.data?.site !== site) {
          additional = { previousStatus: existingCurrentStatus.id };
          ignoreStatusInvalidation = true;
        }
        // Invalidate all current statuses for site
        await invalidateAllStatusForSite(tx, { site, participantId });

        break;
      }
      case PROSPECTING:
        // Invalidate all current statuses for site
        await invalidateAllStatusForSite(tx, { site, participantId });
        break;
      case REJECTED: {
        // Check currentStatus is REJECT_ACKNOWLEDGEMENT or not
        if (currentStatus !== REJECT_ACKNOWLEDGEMENT && currentStatusId) {
          // Create REJECT_ACKNOWLEDGEMENT status
          await tx[collections.PARTICIPANTS_STATUS].save({
            employer_id: employerId,
            participant_id: participantId,
            current: true,
            status: REJECT_ACKNOWLEDGEMENT,
            data: {
              ...data,
              refStatusId: existingCurrentStatus.id,
              refStatus: existingCurrentStatus.status,
            },
          });
        }
        break;
      }
      default:
    }

    // Invalidating current status for all cases except REJECTED
    if (
      existingCurrentStatus &&
      !ignoreStatusInvalidation &&
      existingCurrentStatus.status !== REJECT_ACKNOWLEDGEMENT
    ) {
      tx[collections.PARTICIPANTS_STATUS].update(
        {
          id: existingCurrentStatus.id,
        },
        {
          current: false,
        }
      );
    }

    // Save new status
    const statusObj = await tx[collections.PARTICIPANTS_STATUS].save({
      employer_id: employerId,
      participant_id: participantId,
      status,
      current: true,
      data: {
        ...data,
        ...additional,
      },
    });

    // Sending participant details for in-progress statuses
    if ([PROSPECTING, INTERVIEWING, OFFER_MADE, HIRED].includes(status)) {
      return {
        emailAddress: participant[0].emailAddress,
        phoneNumber: participant[0].phoneNumber,
        status,
        id: statusObj.id,
      };
    }

    // Returning status for all cases
    return { status, id: statusObj.id };
  });

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

export const hideStatusForUser = async ({ userId, statusId }) => {
  // Load status
  const status = await dbClient.db[collections.PARTICIPANTS_STATUS].findOne({ id: statusId });
  if (!status || !status.current) {
    return;
  }

  // Status without site mean legacy status
  if (!status.data?.site) {
    // Invalidate
    await invalidateStatus({ currentStatusId: statusId });
    return;
  }

  // Status with site: hide status for user
  const hiddenForUserIds = {
    ...(status.data?.hiddenForUserIds || {}),
    [userId]: true,
  };
  await dbClient.db[collections.PARTICIPANTS_STATUS].update(
    {
      id: statusId,
    },
    {
      data: {
        ...status.data,
        hiddenForUserIds,
      },
    }
  );
};

export const getParticipantHiredStatuses = async (participantId: number) => {
  const statuses = await dbClient.db[collections.PARTICIPANTS_STATUS].find({
    participant_id: participantId,
    status: 'hired',
    current: true,
  });
  if (statuses.length === 0) {
    throw new Error('Participant is not hired');
  }
  return statuses;
};
