const { dbClient, collections } = require('../db');
const { participantStatus } = require('../constants');
const { FEATURE_MULTI_ORG_PROSPECTING } = require('./feature-flags');
const { withdrawParticipant, getParticipantByID } = require('./participants');

const {
  OPEN,
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
} = participantStatus;

const setParticipantStatus = async (
  employerId,
  participantId,
  status,
  data, // JSONB on the status row
  user,
  currentStatusId = null
) =>
  dbClient.db.withTransaction(async (tx) => {
    // Case PENDING_ACKNOWLEDGEMENT: This status never created through the UI/API.
    if (status === PENDING_ACKNOWLEDGEMENT) {
      return { status: INVALID_STATUS };
    }

    // Load latest hired status
    const hiredStatusItems = await tx[collections.PARTICIPANTS_STATUS].find({
      participant_id: participantId,
      status: HIRED,
      current: true,
    });
    // Statuses from when ROS ends & participant archived
    const isRosComplete = data?.type === 'rosComplete';
    const isRosIncomplete = data?.type === 'employmentEnded';

    // Case: Changing status for hired participant
    if (status !== REJECTED && status !== ARCHIVED) {
      if (hiredStatusItems.length > 0) return { status: ALREADY_HIRED };
    }

    const { site } = data || {};

    // Find existing current status
    let existingCurrentStatus;
    if (FEATURE_MULTI_ORG_PROSPECTING && currentStatusId) {
      // Load current status and validate
      existingCurrentStatus = await tx[collections.PARTICIPANTS_STATUS].findOne({
        id: currentStatusId,
      });
      // Validating existing current status
      if (existingCurrentStatus && !existingCurrentStatus.current) {
        return { status: INVALID_STATUS_TRANSITION, reason: 'invalid-current-status' };
      }
    } else {
      // Legacy Loading current status for employer
      const criteria = { participant_id: participantId, current: true, employer_id: employerId };
      existingCurrentStatus = await tx[collections.PARTICIPANTS_STATUS].findOne(criteria);
    }
    // Checking existing status and new status
    if (
      existingCurrentStatus &&
      existingCurrentStatus.status === status &&
      existingCurrentStatus.data?.site === site
    ) {
      return { status: existingCurrentStatus.status, id: existingCurrentStatus.id };
    }
    // Check the desired status against the current status:
    // -- Rejecting a participant is allowed even if they've been hired elsewhere (handled above)
    // -- Open is the starting point, there is no way to transition here from any other status
    // -- If engaging (prospecting), participant must be coming from open, null, or rejected status
    // -- If interviewing, participant must be coming from prospecting status
    // -- If offer made, must be coming from interviewing
    // -- If hiring, must be coming from offer made
    // -- If restoring a user from being archived, any status should be valid
    if (
      (status === OPEN ||
        (status === PROSPECTING &&
          existingCurrentStatus !== null &&
          existingCurrentStatus.status !== OPEN &&
          existingCurrentStatus.status !== REJECTED) ||
        (status === INTERVIEWING && existingCurrentStatus?.status !== PROSPECTING) ||
        (status === OFFER_MADE && existingCurrentStatus?.status !== INTERVIEWING) ||
        (status === HIRED && existingCurrentStatus?.status !== OFFER_MADE)) &&
      existingCurrentStatus?.status !== ARCHIVED
    )
      return { status: INVALID_STATUS_TRANSITION };

    // Checking

    // Handling Hired Status updated by different employer
    // For Hired status update all existing employer status
    // Creating pending_acknowledgement status for hiring employer
    const hiredStatus = hiredStatusItems[0];
    if (status === ARCHIVED && hiredStatus && hiredStatus.employer_id !== employerId) {
      if (hiredStatus.data.site && user?.sites.includes(hiredStatus.data.site)) {
        await tx[collections.PARTICIPANTS_STATUS].update(
          {
            employer_id: hiredStatus.employer_id,
            participant_id: participantId,
            current: true,
          },
          { current: false }
        );
        // Add an ephemeral status to warn the employer
        await tx[collections.PARTICIPANTS_STATUS].save({
          employer_id: hiredStatus.employer_id,
          participant_id: participantId,
          status: PENDING_ACKNOWLEDGEMENT,
          current: true,
          data,
        });
      } else {
        return { status: INVALID_ARCHIVE };
      }
    }
    // Invalidate pervious status
    let dataToSave = data;
    const invalidateSiteStatus = async () =>
      tx[collections.PARTICIPANTS_STATUS].update(
        {
          participant_id: participantId,
          'data.site': site,
          'status IN': [PROSPECTING, INTERVIEWING, OFFER_MADE],
        },
        {
          current: false,
        }
      );
    if (existingCurrentStatus) {
      // Incase of hire site may mismatch with existing status site
      if (
        existingCurrentStatus.data?.site &&
        existingCurrentStatus.data?.site !== site &&
        status === HIRED
      ) {
        // Now track this info in data body
        dataToSave = { ...dataToSave, previousStatus: existingCurrentStatus.id };
        // Invalidate all previous status for hiring site
        // TODO: May be a notification is required for user
        await invalidateSiteStatus();
      } else {
        await tx[collections.PARTICIPANTS_STATUS].update(
          {
            id: existingCurrentStatus.id,
          },
          { current: false }
        );
        if (!existingCurrentStatus.data?.site && status === HIRED) {
          // Invalidate all current in progress statuses for site
          await invalidateSiteStatus();
        }
      }
    }

    // Save new status
    const statusObj = await tx[collections.PARTICIPANTS_STATUS].save({
      employer_id: employerId,
      participant_id: participantId,
      status,
      current: true,
      data: dataToSave,
    });

    const participant = await tx[collections.PARTICIPANTS].findDoc({
      id: participantId,
    });
    // Now check if current status is archived then set interested flag
    if (status === ARCHIVED && !isRosComplete) {
      // eslint-disable-next-line no-use-before-define
      await withdrawParticipant(participant[0]);
    }

    if ([PROSPECTING, INTERVIEWING, OFFER_MADE, HIRED].includes(status)) {
      return {
        emailAddress: participant[0].emailAddress,
        phoneNumber: participant[0].phoneNumber,
        status,
        id: statusObj.id,
      };
    }

    return { status, id: statusObj.id };
  });

const bulkEngageParticipants = async ({ participants, user }) =>
  Promise.all(
    participants.map(async (id) => {
      const participant = await getParticipantByID({ id });
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

module.exports = {
  setParticipantStatus,
  bulkEngageParticipants,
};
