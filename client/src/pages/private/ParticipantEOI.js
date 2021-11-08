import React, { useEffect, useState } from 'react';
import { withStyles, makeStyles } from '@material-ui/core/styles';
import { Typography, Grid, Button, Box } from '@material-ui/core';
import { Redirect, useParams, useLocation, useHistory } from 'react-router-dom';
import { red } from '@material-ui/core/colors';
import LinearProgress from '@material-ui/core/LinearProgress';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import store from 'store';
import { Routes, ToastStatus } from '../../constants';

import { Page, Alert } from '../../components/generic';
import { Form } from '../../components/participant-form';
import { API_URL } from '../../constants';
import { useToast } from '../../hooks';
import { Dialog } from '../../components/generic';

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
    const [participant] = await response.json();
    return participant || null;
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

const withdrawParticipant = async (id) => {
  const resp = await fetch(`${rootUrl}/${id}/withdraw`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${store.get('TOKEN')}`,
      Accept: 'application/json',
      'Content-type': 'application/json',
    },
    body: JSON.stringify({}),
  });
  return resp.ok;
};

const submitConfirmInterestRequest = async (id) => {
  const resp = await fetch(`${rootUrl}/${id}/reconfirm_interest`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${store.get('TOKEN')}`,
      Accept: 'application/json',
      'Content-type': 'application/json',
    },
    body: JSON.stringify({}),
  });
  return resp.ok;
};

const isHiredParticipant = (participant) =>
  participant.currentStatuses?.some((statusObject) => statusObject.status === 'hired');

const isWithdrawn = (participant) => participant.body?.interested === 'withdrawn';

//TODO: Updating disability status of Form is not working using same component, need more investigation on Formik FastField, For now using different route with same component
export default () => {
  const { id } = useParams();
  const location = useLocation();
  const pathName = location.pathname;
  const { openToast } = useToast();
  const classes = useStyles();
  const history = useHistory();
  // States
  const [participant, setParticipant] = useState(null);
  const [loading, setLoading] = useState(false);
  const [disableWithdraw, setDisableWithdraw] = useState(false);
  const [loadingError, setLoadingError] = useState(false);
  const [openWithdraw, setOpenWithdraw] = useState(false);
  const [openConfirmInterest, setOpenConfirmInterest] = useState(false);
  const enableEdit = pathName.includes('edit');

  // Hooks
  useEffect(() => {
    setLoading(true);
    fetchParticipant(id).then((participant) => {
      setLoading(false);
      if (!participant) {
        setLoadingError(true);
        return;
      }
      setDisableWithdraw(isHiredParticipant(participant) || isWithdrawn(participant));
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
  const onEdit = () => {
    const pathToPush = enableEdit ? pathName.split('/edit')[0] : `${pathName}/edit`;
    history.push(pathToPush);
  };

  const onConfirmInterest = async () => {
    setOpenConfirmInterest(false);
    setLoading(true);
    const success = await submitConfirmInterestRequest(id);
    if (success) {
      history.push(Routes.ParticipantActionSuccess.replace(':id', id));
      return;
    } else {
      openToast({
        status: ToastStatus.Error,
        message: 'Confirm interest failure',
      });
    }
    setLoading(false);
  };

  const onClose = () => {
    setOpenWithdraw(false);
    setOpenConfirmInterest(false);
  };

  const onConfirm = async () => {
    setOpenWithdraw(false);
    setLoading(true);
    const success = await withdrawParticipant(id);
    setLoading(false);
    if (success) {
      openToast({
        status: ToastStatus.Success,
        message: 'Withdraw success',
      });
      setDisableWithdraw(true);
      history.push(Routes.ParticipantWithdrawConfirm);
    } else {
      openToast({
        status: ToastStatus.Error,
        message: 'Unable to withdraw',
      });
    }
  };

  // View
  if (!id) return <Redirect to={Routes.ParticipantLanding} />;
  if (loadingError)
    return (
      <>
        <Page hideEmployers={!window.location.hostname.includes('freshworks.club')}>
          <Box mt={20} alignSelf='center'>
            <Typography variant={'h2'}>Unable to access participant</Typography>
          </Box>
          <Box mt={20} alignSelf='center'>
            <Button
              variant={'contained'}
              color={'primary'}
              onClick={() => {
                history.push(Routes.ParticipantLanding);
              }}
            >
              Return to landing page
            </Button>
          </Box>
        </Page>
      </>
    );
  return (
    <div id='participant-view'>
      <Page hideEmployers={!window.location.hostname.includes('freshworks.club')}>
        <Dialog title='Confirm Withdraw' open={openWithdraw} onClose={onClose}>
          <DialogContent>
            <Typography variant='subtitle2'>
              By clicking confirm, you agree to withdraw this PEOI from the Health Career Access
              Program.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose} color='primary'>
              Cancel
            </Button>
            <Button onClick={onConfirm} color='primary'>
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog title='Confirm Interest' open={openConfirmInterest} onClose={onClose}>
          <DialogContent>
            <Typography variant='subtitle2'>
              By clicking Confirm, you agree to proceed with this form to apply for HCAP.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose} color='primary'>
              Cancel
            </Button>
            <Button onClick={onConfirmInterest} color='primary'>
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
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
              <Grid item xs={6}>
                <Grid container spacing={2} justify='flex-end'>
                  <Grid item>
                    <Button variant='contained' onClick={onEdit}>
                      {!enableEdit ? 'Edit Info' : 'Done Edit'}
                    </Button>
                  </Grid>
                  <Grid item>
                    <Button
                      disabled={disableWithdraw}
                      variant='contained'
                      onClick={() => {
                        setOpenConfirmInterest(true);
                      }}
                    >
                      Reconfirm interest
                    </Button>
                  </Grid>
                  <Grid item>
                    <DeleteButton
                      disabled={disableWithdraw}
                      variant='contained'
                      color='primary'
                      onClick={() => setOpenWithdraw(true)}
                    >
                      Withdraw PEOI
                    </DeleteButton>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} sm={11} md={10} lg={8} xl={6}>
              {/** Form */}
              <Form
                initialValues={participant.body}
                isDisabled={!enableEdit}
                hideSummary={true}
                showIdentityQuestions
                enableFields={['phoneNumber', 'postalCode']}
                onSubmit={onFormSubmit}
                editMode={true}
                isSubmitted
              />
            </Grid>
          </Grid>
        )}
        {!participant && !loading && <Alert severity='error'>Unable to load participant</Alert>}
        {!participant && loading && <Alert severity='info'>Loading participant</Alert>}
      </Page>
    </div>
  );
};
