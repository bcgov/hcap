import React from 'react';
import InfoIcon from '@material-ui/icons/Info';
import { ComponentTooltip } from '../components/generic/ComponentTooltip';
import { Button } from '../components/generic';
import { capitalizedString } from './gen-util';
import { addYearToDate } from './date';

/**
 * Returns participant stats message based on the first status provided
 *
 * @param {boolean} isMoH - is this view displayed for MoH user
 * @param {string} status - first status defined in row.status
 * @returns {string} specific status message based on value / capitalized status
 */
const getParticipantStatus = (isMoH, status) => {
  if (status === 'rejected') return 'Archived';
  if (status === 'ros') return 'Return of Service';
  if (status === 'reject_ack') return 'Archived for site';

  if (isMoH && status.startsWith('inprogress')) {
    const count = status.split('_');
    return `In Progress (${count[1]})`;
  }

  if (status === 'offer_made') return 'Offer Made';

  return capitalizedString(status);
};

const getToolTipText = (
  isHiredByOther,
  isROS,
  isArchived,
  isWithdrawn,
  isPendingAcknowledgement,
  isRejectedByPeer,
  isHiredByPeer,
  participantInfo,
  statusInfo
) => {
  if (isROS && !isArchived) {
    const rosStartDate = participantInfo.rosStatuses[0].data.date;
    const isTimeToArchive = addYearToDate(rosStartDate).isBefore(new Date());
    if (isTimeToArchive) {
      return 'Please action and archive this participant to record their outcomes as they have met their one year mark of Return of Service';
    }
  }

  if (isRejectedByPeer) {
    return statusInfo.data?.final_status
      ? `Participant not available. ${capitalizedString(statusInfo.data.final_status)}`
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
  return '';
};

//returns the text that is displayed as the status
const getStatusText = (
  isMoH,
  statusValue,
  isWithdrawn,
  isArchived,
  isRejectedByPeer,
  statusInfo
) => {
  let firstStatus = getParticipantStatus(isMoH, statusValue);
  if (isWithdrawn) {
    firstStatus = 'Withdrawn';
  }
  if (isArchived) {
    firstStatus = 'Archived';
  }

  if (isRejectedByPeer) {
    firstStatus = statusInfo.data?.refStatus
      ? getParticipantStatus(isMoH, statusInfo.data.refStatus)
      : firstStatus;
  }
  return firstStatus;
};

// TODO: make this a proper function or get rid of it
const getButtonData = () => {};

// returns all of the combined data used to generate the status component
// (basically replacing prettifyStatus() with this to get the front-end out of the back-end)
const getStatusData = (
  status,
  id,
  tabValue,
  handleEngage,
  handleAcknowledge,
  isMoH,
  participantInfo
) => {
  //TODO: this is not going to fly
  if (!status) return;

  const statusValue = status[0];
  const { statusInfos = [] } = participantInfo;
  const statusInfo = statusInfos.length > 0 ? statusInfos[0] : {};

  const isWithdrawn = status.includes('withdrawn');
  const isHiredByPeer = status[1] === 'hired_by_peer';
  const isHiredByOther = status.includes('already_hired');
  const isRejectedByPeer = statusValue === 'reject_ack';
  const isROS = statusValue === 'ros';
  const isArchived = status.includes('archived');
  const isPendingAcknowledgement = status.includes('pending_acknowledgement');

  const toolTipText = getToolTipText(
    isHiredByOther,
    isROS,
    isArchived,
    isWithdrawn,
    isPendingAcknowledgement,
    isRejectedByPeer,
    isHiredByPeer,
    participantInfo,
    statusInfo
  );

  const firstStatus = getStatusText(
    isMoH,
    statusValue,
    isWithdrawn,
    isArchived,
    isRejectedByPeer,
    statusInfo
  );

  const rejectData = {
    final_status: statusInfo.data?.final_status || (isWithdrawn ? 'withdrawn' : 'hired by other'),
    previous: isRejectedByPeer ? statusInfo.data?.previous : statusValue,
  };

  const showAcknowledgeButton =
    (tabValue === 'Hired Candidates' && isPendingAcknowledgement) ||
    (tabValue === 'My Candidates' && status.includes('hired_by_peer'));

  const showArchiveButton =
    !['Archived Candidates', 'Participants'].includes(tabValue) &&
    !isHiredByPeer &&
    !isROS &&
    !showAcknowledgeButton;

  return {
    toolTipText,
    firstStatus,
    buttonData: {
      showAcknowledgeButton,
      showArchiveButton,
      additional: rejectData,
    },
  };
};

//TODO: this is getting its logic moved ELSEWHERE (in functions in this file)
// and what remains will become the ParticipantStatus component
export const prettifyStatus = (
  status,
  id,
  tabValue,
  handleEngage,
  handleAcknowledge,
  isMoH = false,
  participantInfo = { statusInfos: [] }
) => {
  const { toolTipText, firstStatus, buttonData } = getStatusData(
    status,
    id,
    tabValue,
    handleEngage,
    handleAcknowledge,
    isMoH,
    participantInfo
  );

  const { showAcknowledgeButton, showArchiveButton, additional } = buttonData;

  const showToolTip = toolTipText !== '' && firstStatus !== 'Archived'; //ParticipantStatus
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      {firstStatus}{' '}
      {showToolTip && (
        <ComponentTooltip
          arrow
          title={
            <div style={{ margin: 10 }}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 10,
                }}
              >
                <InfoIcon color='secondary' style={{ marginRight: 10 }} fontSize='small' />
                {toolTipText}
              </div>
              {showArchiveButton && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                  }}
                >
                  <Button
                    onClick={() => {
                      handleEngage(id, 'rejected', additional, participantInfo);
                    }}
                    size='small'
                    fullWidth={false}
                    text='Move to Archived Candidates'
                  />
                </div>
              )}
              {showAcknowledgeButton && (
                <Button
                  onClick={async () => {
                    handleAcknowledge(id, status.includes('hired_by_peer'), participantInfo);
                  }}
                  size='small'
                  fullWidth={false}
                  text='Acknowledge'
                />
              )}
            </div>
          }
        >
          <InfoIcon style={{ marginLeft: 5 }} color='secondary' />
        </ComponentTooltip>
      )}
    </div>
  );
};
