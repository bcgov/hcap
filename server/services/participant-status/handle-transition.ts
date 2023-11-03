/** Helper file for `set-status` */
import { invalidateAllStatusForSite } from './util';
import { withdrawParticipant } from '../participants';
import { ParticipantStatus as ps } from '../../constants';
import { collections } from '../../db';

const handleArchivedTransition = async ({
  tx,
  hiredStatusItems,
  participantId,
  employerId,
  data,
  isRosComplete,
  site,
  participant,
  user,
}) => {
  // No Previous Hire Status
  if (!hiredStatusItems.length) {
    return { result: { status: ps.INVALID_ARCHIVE, reason: 'Not Hired' } };
  }

  const hiredStatus = hiredStatusItems[0];

  // Check previously archived or not
  const previousArchived = await tx[collections.PARTICIPANTS_STATUS].findOne({
    participant_id: participantId,
    status: ps.ARCHIVED,
  });

  if (previousArchived) {
    return { result: { status: ps.INVALID_ARCHIVE, previousArchived } };
  }

  // Hire Status owner is not same employer or peer
  if (
    hiredStatus.employer_id !== employerId &&
    !user.sites.includes(hiredStatus.data?.site) &&
    !user.isMoh
  ) {
    return { result: { status: ps.INVALID_ARCHIVE } };
  }

  // Participant hired by other employer
  if (hiredStatus.employer_id !== employerId) {
    // Add an ephemeral status to warn the employer
    await tx[collections.PARTICIPANTS_STATUS].save({
      employer_id: hiredStatus.employer_id,
      participant_id: participantId,
      status: ps.PENDING_ACKNOWLEDGEMENT,
      current: true,
      data,
    });
  }

  // Invalidate all current statuses for site
  await invalidateAllStatusForSite(tx, { site, participantId });

  // Withdraw participant from program
  if (!isRosComplete) {
    await withdrawParticipant(participant);
  }

  return {};
};

/**
 * Handles the logic when a participant gets hired into a site
 * @param options
 * @param options.tx Database transaction
 * @param options.existingCurrentStatus Current status of the participant
 * @param options.site Site Id that is hiring participant
 * @param options.participant Participant as pulled from db
 */
const handleHiredTransition = async ({ tx, existingCurrentStatus, site, participant }) => {
  // Invalidate all current statuses for site
  await invalidateAllStatusForSite(tx, { site, participantId: participant.id });

  // If they get hired in a health authority they are not a part of, it gets added to their preferred locations
  // That way, HA users can see participants hired in their region
  const employerSite = await tx[collections.EMPLOYER_SITES].findOne({
    'body.siteId': site,
  });
  const participantPreferredLocations = participant.preferredLocation;
  const siteLocation = employerSite?.body?.healthAuthority;
  if (
    !participantPreferredLocations?.toLowerCase().split(';').includes(siteLocation?.toLowerCase())
  ) {
    await tx[collections.PARTICIPANTS].updateDoc(
      { id: participant.id },
      { preferredLocation: `${participantPreferredLocations};${siteLocation}` }
    );
  }

  // If no previous status with site or previous status site mismatch
  if (existingCurrentStatus.data?.site && existingCurrentStatus.data?.site !== site) {
    return {
      additional: { previousStatus: existingCurrentStatus.id },
      ignoreStatusInvalidation: true,
    };
  }

  return {};
};

export const handleStatusTransitions = async (context: {
  tx;
  user;
  status: ps;
  hiredStatusItems;
  participantId: string;
  employerId: number;
  data;
  site;
  isRosComplete: boolean;
  participant;
  existingCurrentStatus;
  currentStatus;
  currentStatusId: string | number;
}) => {
  switch (context.status) {
    case ps.ARCHIVED:
      return handleArchivedTransition(context);
    case ps.HIRED:
      return handleHiredTransition(context);
    case ps.PROSPECTING:
      // Invalidate all current statuses for site
      await invalidateAllStatusForSite(context.tx, {
        site: context.site,
        participantId: context.participantId,
      });
      break;
    case ps.REJECTED: {
      // Check currentStatus is REJECT_ACKNOWLEDGEMENT or not
      if (context.currentStatus !== ps.REJECT_ACKNOWLEDGEMENT && context.currentStatusId) {
        // Create REJECT_ACKNOWLEDGEMENT status
        await context.tx[collections.PARTICIPANTS_STATUS].save({
          employer_id: context.employerId,
          participant_id: context.participantId,
          current: true,
          status: ps.REJECT_ACKNOWLEDGEMENT,
          data: {
            ...context.data,
            refStatusId: context.existingCurrentStatus.id,
            refStatus: context.existingCurrentStatus.status,
          },
        });
      }
      break;
    }
    default:
  }
  return {};
};
