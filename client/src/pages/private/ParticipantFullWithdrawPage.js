import React from 'react';
import { Grid, Typography, Icon, Link } from '@material-ui/core';
import { Button } from '../../components/generic';
import { Page } from '../../components/generic';
import { makeStyles } from '@material-ui/core/styles';
import MailOutlineIcon from '@material-ui/icons/MailOutline';
import { useHistory } from 'react-router-dom';
import { Routes, HCAP_INFO_EMAIL } from '../../constants';

const useStyles = makeStyles((theme) => ({
  rootContainer: {
    flexGrow: 1,
  },
  info: {
    color: 'rgb(13, 60, 97)',
    borderRadius: '4px',
    border: '1px solid rgb(175, 217, 252)',
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
    align: 'center',
    backgroundColor: 'rgb(230,246,255)',
    maxWidth: '600px',
  },
  icon: {
    height: '100%',
    width: '100%',
    [theme.breakpoints.up('md')]: {
      fontSize: 'large',
    },
    [theme.breakpoints.down('sm')]: {
      fontSize: 'small',
    },
  },
  grid_top_level: {
    maxWidth: '60%',
    paddingTop: 100,
  },
  text: {
    [theme.breakpoints.up('md')]: {
      'text-align': 'center',
    },
  },
}));

export default () => {
  const classes = useStyles();
  const history = useHistory();
  return (
    <Page>
      <Grid className={classes.grid_top_level} container alignContent='center' direction='column'>
        <Grid item>
          <Typography variant={'h4'} className={classes.text}>
            You have withdrawn from HCAP
          </Typography>
        </Grid>
        <Grid item>
          <Typography className={classes.text}>
            You have successfully withdrawn from the program. <br />
            If you wish to rejoin the program please submit another Participant Expression of
            Interest form.
          </Typography>
        </Grid>
        <Button
          text={'Submit Expression of Interest'}
          fullWidth={false}
          style={{ marginTop: '20px' }}
          onClick={() => history.push(Routes.Base)}
        />
        <Grid item container spacing={2} className={classes.info}>
          <Grid item xs={2}>
            <Icon mx={2} component={MailOutlineIcon} className={classes.icon} />
          </Grid>
          <Grid item xs={10}>
            <Typography variant={'h5'}>Need Help?</Typography>
            <Typography>
              Contact a Health Career Access Program agent. <br />
              <Link href={`mailto:${HCAP_INFO_EMAIL}`}>{HCAP_INFO_EMAIL}</Link>
            </Typography>
          </Grid>
        </Grid>
      </Grid>
    </Page>
  );
};
