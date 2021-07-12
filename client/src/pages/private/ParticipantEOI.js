import React, { useEffect, useState } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { Typography, Grid, Button } from '@material-ui/core';
import { Redirect, useParams } from 'react-router-dom';
import { red } from '@material-ui/core/colors';
import store from 'store';
import { Routes } from '../../constants';

import { Page, Alert } from '../../components/generic';
import { Form } from '../../components/participant-form';
import { API_URL } from '../../constants';

const DeleteButton = withStyles((theme) => ({
  root: {
    color: theme.palette.getContrastText(red[500]),
    backgroundColor: red[500],
    '&:hover': {
      backgroundColor: red[700],
    },
  },
}))(Button);

// Helper methods
const fetchParticipant = async (id) => {
  try {
    const response = await fetch(`${API_URL}/api/v1/participant-user/participant/${id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${store.get('TOKEN')}`,
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
    });
    const participants = await response.json();
    return participants[0] || null;
  } catch {
    return null;
  }
};

const isHiredParticipant = (participant) =>
  participant.currentStatuses?.some((statusObject) => statusObject.status === 'hired');

const isWithdrawn = (participant) => participant.body?.interested === 'withdrawn';

export default () => {
  const { id } = useParams();

  // States
  const [participant, setParticipant] = useState(null);
  const [loading, setLoading] = useState(false);
  const [disableWithdraw, setDisableWithdraw] = useState(false);

  // Hooks
  useEffect(() => {
    setLoading(true);
    fetchParticipant(id).then((participant) => {
      setLoading(false);
      setParticipant(participant);
      setDisableWithdraw(isHiredParticipant(participant) && !isWithdrawn(participant));
    });
  }, [id, setLoading, setParticipant, setDisableWithdraw]);

  // View
  if (!id) return <Redirect to={Routes.ParticipantLanding} />;
  return (
    <div id='participant-view'>
      <Page hideEmployers={!window.location.hostname.includes('freshworks.club')}>
        {participant && (
          <Grid container>
            <Grid container direction='row'>
              <Grid item xs={6}>
                <Typography variant='h4'>Participant Express of Interest</Typography>
              </Grid>
              <Grid item xs={6}>
                <DeleteButton disabled={disableWithdraw} variant='contained' color='primary'>
                  Withdraw From the Program
                </DeleteButton>
              </Grid>
            </Grid>
            <Grid item xs={12} sm={11} md={10} lg={8} xl={6}>
              {/** Form */}
              <Form initialValues={participant.body} isDisabled hideSummery={true} />
            </Grid>
          </Grid>
        )}
        {!participant && !loading && <Alert severity='error'>Unable to load participant</Alert>}
        {!participant && loading && <Alert severity='info'>Loading participant</Alert>}
      </Page>
    </div>
  );
};
