import React from 'react';
import InfoIcon from '@material-ui/icons/Info';
import { ComponentTooltip } from '../components/generic/ComponentTooltip';
import { Button } from '../components/generic';

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

  if (isMoH && status.startsWith('inprogress')) {
    const count = status.split('_');
    return `In Progress (${count[1]})`;
  }

  if (status === 'offer_made') return 'Offer Made';

  return status.charAt(0).toUpperCase() + status.slice(1);
};

export const prettifyStatus = (
  status,
  id,
  tabValue,
  handleEngage,
  handleAcknowledge,
  isMoH = false
) => {
  if (!status) return;

  const statusValue = status[0];
  let firstStatus = getParticipantStatus(isMoH, statusValue);
  let isWithdrawn = false;

  if (status.includes('withdrawn')) {
    firstStatus = 'Withdrawn';
    isWithdrawn = true;
  }
  if (status.includes('archived')) {
    firstStatus = 'Archived';
  }
  let toolTip = 'This candidate was hired by another employer.';
  if (isWithdrawn) {
    toolTip = status.includes('pending_acknowledgement')
      ? 'This candidate was archived.'
      : 'Participant is no longer available.';
  }

  if (status[1] === 'hired_by_peer') {
    toolTip = 'This candidate was hired by same site. And available in "Hired Participants" tab.';
  }

  const hideAcknowledgeButton =
    !(tabValue === 'Hired Candidates' && status.includes('pending_acknowledgement')) &&
    !(tabValue === 'My Candidates' && status.includes('hired_by_peer'));
  const hideArchiveButton =
    ['Archived Candidates', 'Participants'].includes(tabValue) ||
    !hideAcknowledgeButton ||
    status[1] === 'hired_by_peer';
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      {firstStatus}{' '}
      {status[1] && firstStatus !== 'Archived' && (
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
                {toolTip}
              </div>
              {!hideArchiveButton && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                  }}
                >
                  <Button
                    onClick={() => {
                      handleEngage(id, 'rejected', {
                        final_status: isWithdrawn ? 'withdrawn' : 'hired by other',
                        previous: statusValue,
                      });
                    }}
                    size='small'
                    fullWidth={false}
                    text='Move to Archived Candidates'
                  />
                </div>
              )}
              {!hideAcknowledgeButton && (
                <Button
                  onClick={async () => {
                    handleAcknowledge(id, status.includes('hired_by_peer'));
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
