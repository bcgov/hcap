import React, { useEffect, useState } from 'react';
import Grid from '@material-ui/core/Grid';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import { Button } from '../../components/generic/Button';
import { useHistory } from 'react-router-dom';

import { makeStyles } from '@material-ui/core/styles';
import store from 'store';
import Typography from '@material-ui/core/Typography';
import { Page } from '../../components/generic';
import { API_URL, Routes } from '../../constants';

const useStyles = makeStyles({
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
    const response = await fetch(`${API_URL}/api/v1/user/participants`, {
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
  const history = useHistory();
  const classes = useStyles();
  useEffect(() => {
    const ue = async () => {
      const participants = await getParticipants();
      setInterests(participants);
    };
    ue();
  }, [setInterests]);
  console.log(interests)
  return (
    <Page>
      <Grid justify={'center'} container spacing={1}>
        {!interests.length && (
          <Grid item xs={12}>
            <Typography>
              It seems you have not submitted an expression of interest. Please submit one!
            </Typography>
          </Grid>
        )}
        {interests.map((item, index) => (
          <Grid item key={index} xs={3}>
            <Card className={classes.root}>
              <CardContent>
                <Typography variant='h5'>
                  {item.firstName} {item.lastName}
                </Typography>
                <Typography className={classes.title} color='textSecondary' gutterBottom>
                  Contact Info: {item.emailAddress}
                  <br/>
                   {item.phoneNumber} 
                </Typography>
                <Typography variant='body2' component='p'>
                  Submitted at: {item.dateSubmitted}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  color={'primary'}
                  text={'View PEOI'}
                  onClick={() => {
                    // Handle case where there is no participant status associated with the PEOI
                    if(item.latestStatus!=='No Status'){
                      history.push(`${Routes.PeoiDetail}?participant_id=${item.participant_id}`)
                    }else{
                      history.push(`${Routes.PeoiDetail}?id=${item.id}`)
                    }
                  }}
                />
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Page>
  );
};
