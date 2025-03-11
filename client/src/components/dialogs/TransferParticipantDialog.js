import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@material-ui/core';
import { List, ListItem, ListItemText } from '@material-ui/core';
import { Typography } from '@material-ui/core';
import { Button } from '../../components/generic';

export const TransferParticipantDialog = ({ open, onClose, selectedParticipant, allCohorts }) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle> Transfer Participant </DialogTitle>
      <DialogContent>
        {selectedParticipant ? (
          <>
            <Typography>
              Transfer: {selectedParticipant.firstName} {selectedParticipant.lastName}
            </Typography>
            {allCohorts.length > 0 ? (
              <List>
                {allCohorts.map((cohort) => (
                  <ListItem button key={cohort.id}>
                    <ListItemText primary={cohort.cohort_name} />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography> Loading cohorts... </Typography>
            )}
          </>
        ) : (
          <Typography> Loading participant details... </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color='primary'>
          Cancel
        </Button>
        <Button onClick={() => {}} color='primary'>
          Transfer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TransferParticipantDialog;
