import React from 'react';
import { Box, Grid, Typography } from '@material-ui/core';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';

import { getCohortName } from '../constants';
import { Dialog, Button } from '../../../../components/generic';

export const AssignCohortDialog = ({ isOpen, onClose, onSubmit, participant, selectedCohort }) => {
  return (
    <Dialog showDivider title='Assign Cohort' open={isOpen} onClose={onClose}>
      <DialogContent>
        <Grid container spacing={4}>
          <Grid item xs={12}>
            <Grid container spacing={1}>
              <Grid item xs={4}>
                <Typography variant='body1'>Participant Name</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant='body2'>{participant?.fullName}</Typography>
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12}>
            <Grid container spacing={1}>
              <Grid item xs={4}>
                <Typography variant='body1'>Assign Cohort</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant='body2'>{getCohortName(selectedCohort)}</Typography>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        <br />
        <Box>
          <Typography variant='body2'>
            Are you sure that you would like to assign this participant to{' '}
            <b>{getCohortName(selectedCohort)}</b>? Please review the above information before
            proceeding.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button
          variant='outlined'
          fullWidth={false}
          onClick={onClose}
          color='primary'
          text='Cancel'
        />
        <Button
          variant='contained'
          onClick={() => onSubmit({ ...selectedCohort })}
          fullWidth={false}
          color='primary'
          text='Assign'
        />
      </DialogActions>
    </Dialog>
  );
};
