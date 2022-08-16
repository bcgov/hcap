import { capitalizedString } from './gen-util';
import { addYearToDate } from './date';

/**
 * Data required to render the Participant Status,
 * Text for tooltip, status text, indications of whether to show buttons, data to pass to buttons
 * @param {[string]} status
 * @param {string} tabValue
 * @param {boolean} isMoH
 * @param {object} participantInfo
 * @returns { {toolTipText, statusText, buttonData} || null }
 */

export const getParticipantStatusData = (status, tabValue, isMoH, participantInfo) => {
  console.log(status);
  console.log(participantInfo);
  if (!status) return;

  const statusValue = status[0];
  const { statusInfos = [] } = participantInfo;
  const statusInfo = statusInfos.length > 0 ? statusInfos[0] : {};

  const isRejectedByPeer = statusValue === 'reject_ack';
  const isROS = statusValue === 'ros';
  const isHiredByPeer = status[1] === 'hired_by_peer';
  const isHiredByOther = status.includes('already_hired');
  console.log(isHiredByOther)
  const isPendingAcknowledgement = status.includes('pending_acknowledgement');
  const isWithdrawn = status.includes('withdrawn');
  const isArchived = status.includes('archived');
  const rosStartDate = isROS ? participantInfo.rosStatuses[0].data.date : null;
  const finalStatus = statusInfo.data?.final_status ?? null;

  const toolTipText = getToolTipText({
    isWithdrawn,
    isRejectedByPeer,
    isHiredByPeer,
    isHiredByOther,
    isArchived,
    isPendingAcknowledgement,
    rosStartDate,
    finalStatus,
  });

  const statusText = getStatusText(
    isMoH,
    statusValue,
    isWithdrawn,
    isArchived,
    isRejectedByPeer,
    statusInfo
  );

  const rejectData = {
    final_status: finalStatus || (isWithdrawn ? 'withdrawn' : 'hired by other'),
    previous: isRejectedByPeer ? statusInfo.data?.previous : statusValue,
  };

  const showAcknowledgeButton =
    (tabValue === 'Hired Candidates' && isPendingAcknowledgement) ||
    (tabValue === 'My Candidates' && status.includes('hired_by_peer'));

  const showArchiveButton =
    !['Archived Candidates', 'Participants'].includes(tabValue) &&
    !isHiredByPeer &&
    // !isROS &&
    !showAcknowledgeButton;

  return {
    toolTipText,
    statusText,
    buttonData: {
      showAcknowledgeButton,
      showArchiveButton,
      additional: rejectData,
    },
  };
};

/**
 * Text to display for status
 * @param {boolean} isMoH
 * @param {string} statusValue
 * @param {boolean} isWithdrawn
 * @param {boolean} isArchived
 * @param {boolean} isRejectedByPeer
 * @param {object} statusInfo
 * @returns {string}
 */
const getStatusText = (
  isMoH,
  statusValue,
  isWithdrawn,
  isArchived,
  isRejectedByPeer,
  statusInfo
) => {
  let statusText = getParticipantStatus(isMoH, statusValue);
  if (isWithdrawn) {
    statusText = 'Withdrawn';
  }
  if (isArchived) {
    statusText = 'Archived';
  }

  if (isRejectedByPeer) {
    statusText = statusInfo.data?.refStatus
      ? getParticipantStatus(isMoH, statusInfo.data.refStatus)
      : statusText;
  }
  return statusText;
};

/**
 * Text to display in tooltip. Empty string if nothing to display
 * @param {boolean} isWithdrawn
 * @param {boolean} isRejectedByPeer
 * @param {boolean} isHiredByPeer
 * @param {boolean} isHiredByOther
 * @param {boolean} isArchived
 * @param {boolean} isPendingAcknowledgement
 * @param {Date} rosStartDate
 * @param {string} finalStatus
 * @returns {string}
 */
const getToolTipText = ({
  isWithdrawn,
  isRejectedByPeer,
  isHiredByPeer,
  isHiredByOther,
  isArchived,
  isPendingAcknowledgement,
  rosStartDate,
  finalStatus,
}) => {
  if (isRejectedByPeer) {
    return finalStatus
      ? `Participant not available. ${capitalizedString(finalStatus)}`
      : 'Participant is no longer available. ';
  }

  if (isWithdrawn) {
    return isPendingAcknowledgement
      ? 'This candidate was archived.'
      : 'Participant is no longer available.';
  }

  if (isHiredByPeer) {
    return 'This candidate was hired to another site and is visible under the "Hired Candidates" tab.';
  }

  if (isHiredByOther) {
    return 'This candidate was hired by another site.';
  }

  if (rosStartDate && !isArchived) {
    const isTimeToArchive = addYearToDate(rosStartDate).isBefore(new Date());
    if (isTimeToArchive) {
      return 'Please action and archive this participant to record their outcomes as they have met their one year mark of Return of Service';
    }
  }
  return '';
};

/**
 * Returns participant status message based on the first status provided
 * @param {boolean} isMoH - is this view displayed for MoH user
 * @param {string} status - first status defined in row.status
 * @returns {string} specific status message based on value / capitalized status
 */
const getParticipantStatus = (isMoH, status) => {
  const lStatus = status.toLowerCase();
  if (isMoH && (lStatus.startsWith('inprogress') || lStatus === 'in progress')) {
    const count = lStatus.split('_');
    return `In Progress (${count[1]})`;
  }

  switch (lStatus) {
    case 'rejected':
      return 'Archived';
    case 'ros':
      return 'Return of Service';
    case 'reject_ack':
      return 'Archived for site';
    case 'offer_made':
      return 'Offer Made';
    default:
      return capitalizedString(status);
  }
};
