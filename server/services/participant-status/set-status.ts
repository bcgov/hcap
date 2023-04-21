import { UUID } from 'massive';
import { dbClient, collections } from '../../db';
import { ParticipantStatus } from '../../constants';
import { previousStatusesMap } from './util';
import { handleStatusTransitions } from './handle-transition';

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
  ALREADY_HIRED,
  REJECT_ACKNOWLEDGEMENT,
} = ParticipantStatus;

/** Gets current participant status with context of employer */
const getCurrentStatus = async (
  currentStatusId: string | number,
  tx,
  participantId: string,
  employerId: number
) =>
  currentStatusId
    ? tx[collections.PARTICIPANTS_STATUS].findOne({ id: currentStatusId })
    : tx[collections.PARTICIPANTS_STATUS].findOne({
        participant_id: participantId,
        current: true,
        employer_id: employerId,
      });

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
  employerId: number,
  participantId: string | UUID,
  status: ParticipantStatus,
  data?, // JSONB on the status row
  user: { isEmployer?: boolean; sites?: number[]; id?: number } = {
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

    // ROS complete status check
    const isRosComplete = data?.type === 'rosComplete';

    // Getting current participant status with context of employer
    const existingCurrentStatus = await getCurrentStatus(
      currentStatusId,
      tx,
      participantId,
      employerId
    );

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
    const [participant] = await tx[collections.PARTICIPANTS].findDoc({
      id: participantId,
    });

    // Handle individual status transitions
    const transitionResult = await handleStatusTransitions({
      tx,
      user,
      status,
      hiredStatusItems,
      participantId,
      employerId,
      data,
      site,
      isRosComplete,
      participant,
      existingCurrentStatus,
      currentStatus,
      currentStatusId,
    });
    // If we got a result body in the status transitions, we can return it now
    if ('result' in transitionResult) return transitionResult.result;
    // Otherwise, we carry on with the rest of the process

    // Ignore existingStatus invalidation
    const ignoreStatusInvalidation =
      'ignoreStatusInvalidation' in transitionResult
        ? transitionResult.ignoreStatusInvalidation
        : false;
    // Additional Info to save
    const additional = 'additional' in transitionResult ? transitionResult.additional : {};

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
        emailAddress: participant.emailAddress,
        phoneNumber: participant.phoneNumber,
        status,
        id: statusObj.id,
      };
    }

    // Returning status for all cases
    return { status, id: statusObj.id };
  });
