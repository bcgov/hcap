import React, { useEffect, useState } from 'react';
import { withStyles, makeStyles } from '@material-ui/core/styles';
import { Typography, Grid, Button } from '@material-ui/core';
import { Redirect, useParams, useLocation } from 'react-router-dom';
import { red } from '@material-ui/core/colors';
import LinearProgress from '@material-ui/core/LinearProgress';
import store from 'store';
import { Routes, ToastStatus } from '../../constants';

import { Page, Alert } from '../../components/generic';
import { Form } from '../../components/participant-form';
import { API_URL } from '../../constants';
import { useQuery, useToast } from '../../hooks';

const rootUrl = `${API_URL}/api/v1/participant-user/participant`;

// Custom UI
const DeleteButton = withStyles((theme) => ({
  root: {
    color: theme.palette.getContrastText(red[500]),
    backgroundColor: red[500],
    '&:hover': {
      backgroundColor: red[700],
    },
  },
}))(Button);

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    '& > * + *': {
      marginTop: theme.spacing(2),
    },
  },
}));

const getForm = ({ isDisabled, data, onFormSubmit }) => (
  <Form
    initialValues={data}
    isDisabled={isDisabled}
    hideSummery={true}
    enableFields={['phoneNumber', 'postalCode', 'consent']}
    onSubmit={onFormSubmit}
    editMode={true}
  />
);

// Helper methods
const fetchParticipant = async (id) => {
  try {
    const response = await fetch(`${rootUrl}/${id}`, {
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

const updateParticipant = async (values, id) => {
  const { phoneNumber, postalCode } = values;
  let postalCodeFsa;
  if (postalCode && postalCode.length > 3) {
    postalCodeFsa = postalCode.slice(0, 3);
  }
  const body = {
    phoneNumber: phoneNumber.toString(),
    postalCode,
    postalCodeFsa,
  };
  const resp = await fetch(`${rootUrl}/${id}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${store.get('TOKEN')}`,
      Accept: 'application/json',
      'Content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return resp.ok;
};

const isHiredParticipant = (participant) =>
  participant.currentStatuses?.some((statusObject) => statusObject.status === 'hired');

const isWithdrawn = (participant) => participant.body?.interested === 'withdrawn';

export default () => {
  const { id } = useParams();
  const query = useQuery();
  const location = useLocation();
  const edit = query.get('edit');
  const { openToast } = useToast();
  const classes = useStyles();
  // States
  const [participant, setParticipant] = useState(null);
  const [loading, setLoading] = useState(false);
  const [disableWithdraw, setDisableWithdraw] = useState(false);
  const enableEdit = edit === 'true';

  // Hooks
  useEffect(() => {
    setLoading(true);
    fetchParticipant(id).then((participant) => {
      setLoading(false);
      setDisableWithdraw(isHiredParticipant(participant) && !isWithdrawn(participant));
      setParticipant(participant);
    });
  }, [id, setLoading, setParticipant, setDisableWithdraw]);

  // User Action
  const onFormSubmit = async (vales) => {
    setLoading(true);
    const success = await updateParticipant(vales, id);
    setLoading(false);
    if (success) {
      openToast({
        status: ToastStatus.Success,
        message: 'Update success',
      });
    } else {
      openToast({
        status: ToastStatus.Error,
        message: 'Unable to update participant details',
      });
    }
  };

  // View
  if (!id) return <Redirect to={Routes.ParticipantLanding} />;
  return (
    <div id='participant-view'>
      <Page hideEmployers={!window.location.hostname.includes('freshworks.club')}>
        {loading && (
          <div className={classes.root}>
            <LinearProgress />
          </div>
        )}
        {participant && (
          <Grid justify='center' container>
            <Grid container direction='row'>
              <Grid item xs={6}>
                <Typography variant='h4'>Participant Express of Interest</Typography>
              </Grid>
              <Grid item xs={2}>
                <Button
                  variant='contained'
                  onClick={() => {
                    // TODO: History push is not working possibly want some more investigation
                    if (enableEdit) window.location.href = `${location.pathname}`;
                    else window.location.href = `${location.pathname}?edit=true`;
                  }}
                >
                  {!enableEdit ? 'Edit Info' : 'Done Edit'}
                </Button>
              </Grid>
              <Grid item xs={4}>
                <DeleteButton disabled={disableWithdraw} variant='contained' color='primary'>
                  Withdraw From the Program
                </DeleteButton>
              </Grid>
            </Grid>
            <Grid item xs={12} sm={11} md={10} lg={8} xl={6}>
              {/** Form */}
              {enableEdit
                ? getForm({ data: participant.body, isDisabled: false, onFormSubmit })
                : getForm({ data: participant.body, isDisabled: true, onFormSubmit })}
            </Grid>
          </Grid>
        )}
        {!participant && !loading && <Alert severity='error'>Unable to load participant</Alert>}
        {!participant && loading && <Alert severity='info'>Loading participant</Alert>}
      </Page>
    </div>
  );
};
