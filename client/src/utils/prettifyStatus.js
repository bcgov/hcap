import React from 'react';
import InfoIcon from '@material-ui/icons/Info';
import { ComponentTooltip } from '../components/generic/ComponentTooltip';
import { Button } from '../components/generic';

export const prettifyStatus = (status, id, tabValue, handleEngage) => {
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
  const toolTip = isWithdrawn
    ? 'Participant is no longer available.'
    : 'This candidate was hired by another employer.';

  const hideArchiveButton = [ 'Archived Candidates', 'Participants'].includes(
    tabValue
  );
  
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
            </div>
          }
        >
          <InfoIcon style={{ marginLeft: 5 }} color='secondary' />
        </ComponentTooltip>
      )}
    </div>
  );
};
