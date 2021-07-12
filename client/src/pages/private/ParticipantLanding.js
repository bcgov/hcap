import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import Grid from '@material-ui/core/Grid';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Button from '@material-ui/core/Button';
import { makeStyles } from '@material-ui/core/styles';
import store from 'store';
import Typography from '@material-ui/core/Typography';
import { Page } from '../../components/generic';
import { API_URL, Routes } from '../../constants';

const useStyles = makeStyles({
  rootContainer: {
    flexGrow: 1,
  },
  root: {
    minWidth: 275,
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
});

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
  const classes = useStyles();
  const history = useHistory();
  useEffect(() => {
    getParticipants().then((items) => setInterests(items));
  }, [setInterests]);
  return (
    <Page>
      <Grid className={classes.rootContainer} container spacing={1}>
        <Grid item xs={12}>
          <Grid container spacing={3}>
            {interests.map((item, index) => (
              <Grid key={index} item>
                <Card className={classes.root}>
                  <CardContent>
                    <Typography variant='h5' component='h2'>
                      {item.firstName} {item.lastName}
                    </Typography>
                    <Typography className={classes.title} color='textSecondary' gutterBottom>
                      {item.emailAddress}
                    </Typography>
                    <Typography className={classes.pos} color='textSecondary'>
                      Region: {item.preferredLocation}
                    </Typography>
                    <Typography variant='body2' component='p'>
                      Submitted at: {item.submittedAt}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      variant='outlined'
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
            ))}
          </Grid>
        </Grid>
      </Grid>
    </Page>
  );
};
