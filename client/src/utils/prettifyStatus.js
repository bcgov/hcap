import React from 'react';
import InfoIcon from '@material-ui/icons/Info';
import { ComponentTooltip } from '../components/generic/ComponentTooltip';
import { Button } from '../components/generic';

export const prettifyStatus = (status, id, tabValue, handleEngage, handleAcknowledge) => {
  let firstStatus = status[0];
  let isWithdrawn = false;
  if (status[0] === 'offer_made') firstStatus = 'Offer Made';
  if (status[0] === 'open') firstStatus = 'Open';
  if (status[0] === 'prospecting') firstStatus = 'Prospecting';
  if (status[0] === 'interviewing') firstStatus = 'Interviewing';
  if (status[0] === 'rejected') firstStatus = 'Archived';
  if (status[0] === 'hired') firstStatus = 'Hired';
  if (status.includes('withdrawn')) {
    firstStatus = 'Withdrawn';
    isWithdrawn = true;
  }
  if (status.includes('archived')) {
    firstStatus = 'Archived';
  }
  let toolTip = 'This candidate was hired by another employer.';
  if (isWithdrawn) {
    if (status.includes('pending_acknowledgement')) {
      toolTip = 'This candidate was archived.';
    } else {
      toolTip = 'Participant is no longer available.';
    }
  }
  const hideAcknowledgeButton = !(
    tabValue === 'Hired Candidates' && status.includes('pending_acknowledgement')
  );
  const hideArchiveButton =
    ['Hired Candidates', 'Archived Candidates', 'Participants'].includes(tabValue) &&
    !hideAcknowledgeButton;

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
                        previous: status[0],
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
                    handleAcknowledge(id);
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
