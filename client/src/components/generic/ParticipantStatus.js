import React from 'react';
import InfoIcon from '@material-ui/icons/Info';
import { ComponentTooltip } from './ComponentTooltip';
import { Button } from './Button';
import { getParticipantStatusData } from '../../utils/prettifyStatus';

export const ParticipantStatus = ({
  status,
  id,
  tabValue,
  handleEngage,
  handleAcknowledge,
  isMoH = false,
  participantInfo = { statusInfos: [] },
}) => {
  const { toolTipText, statusText, buttonData } = getParticipantStatusData(
    status,
    tabValue,
    isMoH,
    participantInfo
  );

  const { showAcknowledgeButton, showArchiveButton, additional } = buttonData;

  const showToolTip = toolTipText !== '' && statusText !== 'Archived';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      {statusText}{' '}
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
