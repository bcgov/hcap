import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import {Grid,Card,Box,Typography,Button ,CardActions} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import store from 'store';
import { Page } from '../../components/generic';
import { API_URL, Routes } from '../../constants';
const moment = require('moment')

const useStyles = makeStyles((theme)=>({
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
  posBox:{  
    maxWidth:"80%",
    paddingTop:50
  },
  card:{
    paddingBottom:10,
    paddingInline:20
  },
  peoiLabel:{
    color:"#9F9F9F"
  },
  idBox:{
    paddingInline:30,
    paddingTop:5,
    paddingBottom:5,
    marginRight:-20
  }
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
  const classes = useStyles();
  const history = useHistory();
  useEffect(() => {
    getParticipants().then((items) => setInterests(items));
  }, [setInterests]);
  return (
    <Page>
      <Grid className = {classes.posBox} container spacing={2}>
        {interests.map((item, index) => (
          <Grid item={true} key={index} xs={12} sm={6} md={3}>
            <Card className={classes.card} >
              <Grid container item xs={12} justify = {"flex-end"}>
                      <Box className={classes.idBox} bgcolor="primary.main">
                        <Typography style={{color:'#FFFFFF'}} variant={"subtitle2"}>
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
                  <Typography className={classes.peoiLabel}>
                    Contact info
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  {item.emailAddress}
                  <br/>
                  {item.phoneNumber}
                </Grid>
                <Grid  item xs={6}>
                  <Typography className={classes.peoiLabel}>
                    Date submitted
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  {moment(item.dateSubmitted).format("MMM DD,YYYY")}
                </Grid>
                <Grid item xs={6}>
                  <Typography className={classes.peoiLabel}>
                    Status
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  {item.status}
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
        ))}
      </Grid>
    </Page>
  );
};
