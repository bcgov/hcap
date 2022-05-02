import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  Grid,
  Card,
  Box,
  Typography,
  Button,
  CardActions,
  Dialog,
  CircularProgress,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import store from 'store';
import { Page } from '../../components/generic';
import { API_URL, Routes, ToastStatus } from '../../constants';
import { PEOIWithdrawalDialogForm } from '../../components/modal-forms/PEOIWithdrawalDialogForm';
import { genericConfirm } from '../../constants/validation';
import { IndigenousDeclarationForm } from '../../components/modal-forms/IndigenousDeclarationForm';
import isNil from 'lodash/isNil';
import { useToast } from '../../hooks';
import ParticipantLandingEmpty from './ParticipantLandingEmpty';
import dayjs from 'dayjs';

const rootUrl = `${API_URL}/api/v1/participant-user/participant`;

const useStyles = makeStyles(() => ({
  rootContainer: {
    flexGrow: 1,
  },
  root: {
    minWidth: 275,
    margin: 10,
  },
  bullet: {
    display: 'inline-block',
    margin: '0 2px',
    transform: 'scale(0.8)',
  },
  title: {
    fontSize: 14,
  },
  pos: {
    marginBottom: 12,
  },
  posBox: {
    maxWidth: '80%',
    paddingTop: 50,
  },
  card: {
    paddingBottom: 10,
    paddingInline: 20,
  },
  peoiLabel: {
    color: '#9F9F9F',
  },
  idBox: {
    paddingInline: 30,
    paddingTop: 5,
    paddingBottom: 5,
    marginRight: -20,
  },
  info: {
    color: 'rgb(13, 60, 97)',
    borderRadius: '4px',
    border: '1px solid rgb(175, 217, 252)',
    width: '100%',
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
  },
}));

const getParticipants = async () => {
  try {
    const response = await fetch(`${API_URL}/api/v1/participant-user/participants`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${store.get('TOKEN')}`,
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
    });
    return response.json();
  } catch {
    return [];
  }
};

export default () => {
  const [interests, setInterests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [hideIndigenousIdentityForm, setHideIndigenousIdentityForm] = useState(false);
  const [allWithdrawn, setAllWithdrawn] = useState(false);
  const classes = useStyles();
  const history = useHistory();
  const { openToast } = useToast();
  const afterInterestFetch = (items) => {
    const withdrawn = items.filter((item) => item.interested === 'withdrawn');
    setAllWithdrawn(withdrawn.length === items.length);
    setInterests(items);
  };
  const submitWithdrawal = async (values) => {
    if (values.confirmed) {
      await fetch(`${API_URL}/api/v1/participant-user/withdraw`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${store.get('TOKEN')}`,
          Accept: 'application/json',
          'Content-type': 'application/json',
        },
      });
    }
    await getParticipants().then((items) => afterInterestFetch(items));
    setShowWithdrawDialog(false);
  };
  useEffect(() => {
    getParticipants().then((items) => {
      const withdrawn = items.filter((item) => item.interested === 'withdrawn');
      setAllWithdrawn(withdrawn.length === items.length);
      setInterests(items);
      setIsLoading(false);
    });
  }, [setAllWithdrawn, setInterests, setIsLoading]);

  if (isLoading) {
    return (
      <Page>
        <Box height='100%' display='flex' alignItems='center'>
          <CircularProgress />
        </Box>
      </Page>
    );
  }

  if (interests.length === 0) {
    return (
      <Page>
        <ParticipantLandingEmpty />
      </Page>
    );
  }

  const hasEmptyIndigenousQuestions =
    interests.length > 0 &&
    !!interests.find((item) => item.isIndigenous === null || item.isIndigenous === undefined);

  const handleIndigenousIdentitySubmission = async (values) => {
    // If the user doesn't fill in the form, hide it for now, it will be shown again on next page load
    if (isNil(values.isIndigenous)) {
      setHideIndigenousIdentityForm(true);
      return;
    }

    const { isIndigenous, ...submittedIdentities } = values;
    const identities = Object.entries(submittedIdentities)
      .map(([identity, selected]) => (selected ? identity : null))
      .filter(Boolean);

    const response = await fetch(`${rootUrl}/batch`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${store.get('TOKEN')}`,
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
      body: JSON.stringify({
        isIndigenous: values.isIndigenous,
        indigenousIdentities: identities,
      }),
    });
    if (response.ok) {
      await getParticipants().then((items) => {
        afterInterestFetch(items);
      });
      setHideIndigenousIdentityForm(true);
    } else {
      openToast({
        status: ToastStatus.Error,
        message: response.error || response.statusText || 'Server error',
      });
    }
  };

  return (
    <Page>
      <Dialog open={showWithdrawDialog}>
        <PEOIWithdrawalDialogForm
          initialValues={{
            confirmed: false,
          }}
          validationSchema={genericConfirm}
          onClose={() => {
            setShowWithdrawDialog(false);
          }}
          onSubmit={async (values) => {
            await submitWithdrawal(values);
            history.push(Routes.ParticipantFullWithdraw);
          }}
        />
      </Dialog>
      <Dialog open={hasEmptyIndigenousQuestions && !hideIndigenousIdentityForm}>
        <IndigenousDeclarationForm handleSubmit={handleIndigenousIdentitySubmission} />
      </Dialog>
      <Grid className={classes.posBox} container spacing={2}>
        <Grid style={{ paddingTop: 10 }} item xs={12}>
          <Typography variant='h2'>My Profile</Typography>
          {interests.length > 1 && (
            <Box className={classes.info} style={{ backgroundColor: 'rgb(232, 244, 253)' }}>
              <Typography variant='subtitle1'>
                Multiple Participant Expression of Interest Forms Found
              </Typography>
              <Typography>
                We found multiple Participant Expression of Interest (PEOI) forms associated with
                your email. Please go through each PEOI by clicking "View PEOI" and review the
                details to confirm your interest or withdraw from the program.
              </Typography>
            </Box>
          )}
          <Box
            className={classes.info}
            style={{ backgroundColor: '#EEEEEE', borderColor: '#888888' }}
          >
            {!allWithdrawn && (
              <Typography variant='subtitle2'>
                If you want to completely withdraw from the program, please click on the "Completely
                Withdraw" button here.
                <Button
                  style={{
                    color: '#FFFFFF',
                    backgroundColor: '#FF0000',
                    marginLeft: 20,
                    paddingInline: 20,
                  }}
                  onClick={() => {
                    setShowWithdrawDialog(true);
                  }}
                >
                  Completely Withdraw
                </Button>
              </Typography>
            )}
            {allWithdrawn && (
              <Grid container>
                <Grid item xs={10}>
                  <Typography variant='body1'>
                    Your expression of interest has been withdrawn from the employer view. If you
                    wish to be considered for future participation in HCAP, please resubmit your
                    expression of interest.
                  </Typography>
                </Grid>
                <Grid item xs={2} alignItems='end'>
                  <Button
                    style={{
                      color: '#FFFFFF',
                      backgroundColor: '#FF0000',
                      marginLeft: 10,
                      paddingInline: 10,
                    }}
                    onClick={() => {
                      history.replace('/');
                    }}
                  >
                    Resubmit
                  </Button>
                </Grid>
              </Grid>
            )}
          </Box>
        </Grid>

        {interests.map((item, index) => {
          let status = 'Active';
          let color = '#009BDD';
          if (item.interested === 'withdrawn') {
            status = 'Withdrawn';
            color = '#8C8C8C';
          } else if (item.hired?.length > 0) {
            color = '#17d149';
            status = 'Hired';
          } else if (!item.interested) {
            color = '#735613';
            status = 'Pending';
          }

          return (
            <Grid item={true} key={index} xs={12} sm={6} md={4}>
              <Card className={classes.card}>
                <Grid container item xs={12} justify={'flex-end'}>
                  <Box className={classes.idBox} bgcolor='primary.main'>
                    <Typography style={{ color: '#FFFFFF' }} variant={'subtitle2'}>
                      {item.id}
                    </Typography>
                  </Box>
                </Grid>
                <Grid container spacing={0}>
                  <Grid item xs={12}>
                    <Typography variant={'subtitle2'}>
                      {item.firstName} {item.lastName}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography className={classes.peoiLabel}>Contact info</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    {item.emailAddress}
                    <br />
                    {item.phoneNumber}
                  </Grid>
                  <Grid item xs={6}>
                    <Typography className={classes.peoiLabel}>Date submitted</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    {dayjs(item.submittedAt).format('MMM DD,YYYY')}
                  </Grid>
                  <Grid item xs={6}>
                    <Typography className={classes.peoiLabel}>Latest Status</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Box
                      style={{
                        borderRadius: 5,
                        marginBlock: '5px',
                        padding: '5px 20px',
                        fontWeight: 'bold',
                        backgroundColor: color,
                        color: 'white',
                        textAlign: 'center',
                      }}
                    >
                      {status}
                    </Box>
                  </Grid>
                  {!item.interested && (
                    <Box
                      style={{
                        borderRadius: 5,
                        marginBlock: '5px',
                        padding: '5px 20px',
                        fontWeight: 'bold',
                        backgroundColor: '#f9f3cd',
                        color: '#785c19',
                      }}
                    >
                      Please review your PEOI to reconfirm interest or withdraw from the program
                    </Box>
                  )}
                </Grid>
                <CardActions justify={'center'}>
                  <Button
                    variant='outlined'
                    fullWidth={true}
                    onClick={() => {
                      const path = Routes.ParticipantEOI.replace(':id', item.id);
                      history.push(path);
                    }}
                  >
                    View PEOI
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Page>
  );
};
