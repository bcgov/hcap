import React, { Fragment } from 'react';

import { Box, Divider, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import { Button } from '../generic';
import { useAuth } from '../../providers/AuthContext';
import { Role } from '../../constants';

const useStyles = makeStyles((theme) => ({
  formText: {
    fontWeight: 400,
  },
  formButton: {
    maxWidth: '200px',
  },
  formDivider: {
    marginBottom: theme.spacing(2),
    marginTop: theme.spacing(4),
  },
}));

const getConfirmMessage = (hasMultipleParticipants, isMoH) => {
  let message = hasMultipleParticipants ? ` participants have` : ' has';
  message += ` been engaged.`;
  if (!isMoH) {
    message += 'These candidates can now be found in the My Candidates Tab.';
  }
  return message;
};

export const ProspectingForm = ({ name, participantsCount, onClose, onSubmit }) => {
  const { auth } = useAuth();
  const isMoH = auth?.user?.roles?.includes(Role.MinistryOfHealth);
  const classes = useStyles();
  const hasMultipleParticipants = participantsCount > 1;

  return (
    <Fragment>
      <Typography variant='subtitle2' className={classes.formText}>
        <b>{hasMultipleParticipants ? participantsCount : name}</b>
        {getConfirmMessage(hasMultipleParticipants, isMoH)}
      </Typography>

      <Divider className={classes.formDivider} />

      <Box display='flex' justifyContent={!isMoH ? 'space-between' : 'center'}>
        <Button className={classes.formButton} onClick={onClose} variant='outlined' text='Close' />
        {!isMoH && (
          <Button
            className={classes.formButton}
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
