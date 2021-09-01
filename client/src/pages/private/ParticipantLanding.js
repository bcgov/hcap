import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Grid, Card, Box, Typography, Button, CardActions, Dialog } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import store from 'store';
import { Page } from '../../components/generic';
import { API_URL, Routes } from '../../constants';
import { PEOIWithdrawalDialogForm } from '../../components/modal-forms/PEOIWithdrawalDialogForm';
import { genericConfirm } from '../../constants/validation';
const moment = require('moment');

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
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const classes = useStyles();
  const history = useHistory();
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
    await getParticipants().then((items) => setInterests(items));
    setShowWithdrawDialog(false);
  };
  useEffect(() => {
    getParticipants().then((items) => setInterests(items));
  }, [setInterests]);

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
            <Typography>
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
                    {moment(item.submittedAt).format('MMM DD,YYYY')}
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
                        backgroundColor: color,
                        color: 'white',
                      }}
                    >
                      {status}
                    </Box>
                  </Grid>
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
