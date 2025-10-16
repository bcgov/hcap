import React, { Fragment } from 'react';

import { Box, Divider, Typography } from '@mui/material';

import { Button } from '../generic';
import { useAuth } from '../../providers/AuthContext';
import { Role } from '../../constants';

const getConfirmMessage = (hasMultipleParticipants, isMoH) => {
  let message = hasMultipleParticipants ? ` participants have` : ' has';
  message += ` been engaged. `;
  if (!isMoH) {
    message += 'These candidates can now be found in the My Candidates Tab.';
  }
  return message;
};

export const ProspectingForm = ({ name, participantsCount, onClose, onSubmit }) => {
  const { auth } = useAuth();
  const isMoH = auth?.user?.roles?.includes(Role.MinistryOfHealth);
  const hasMultipleParticipants = participantsCount > 1;

  return (
    <Fragment>
      <Typography variant='subtitle2' sx={{ fontWeight: 400 }}>
        <b>{hasMultipleParticipants ? participantsCount : name}</b>
        {getConfirmMessage(hasMultipleParticipants, isMoH)}
      </Typography>

      <Divider sx={{ my: 2, mt: 4 }} />

      <Box display='flex' justifyContent={!isMoH ? 'space-between' : 'center'}>
        <Button sx={{ maxWidth: '200px' }} onClick={onClose} variant='outlined' text='Close' />
        {!isMoH && (
          <Button
            sx={{ maxWidth: '200px' }}
            onClick={onSubmit}
            variant='contained'
            color='primary'
            text='View My Candidates'
          />
        )}
      </Box>
    </Fragment>
  );
};
