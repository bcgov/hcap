import React from 'react';
import Typography from '@material-ui/core/Typography';
import { Page, Button } from '../../components/generic';
import Box from '@material-ui/core/Box';
import { makeStyles } from '@material-ui/core/styles';
import { Routes } from '../../constants';
import { useHistory } from 'react-router-dom';
import InfoIcon from '@material-ui/icons/Info';

import backgroundImage from '../../assets/images/employer_login_bg.png';

const useStyles = makeStyles((theme) => ({
  blueText: {
    color: theme.palette.primary.light,
  },
  blueBox: {
    backgroundColor: '#EDF6FF',
    maxWidth: 554,
  },
  pageContainer: {
    [theme.breakpoints.down('md')]: {
      flexDirection: 'column',
    },
    [theme.breakpoints.up('md')]: {
      flexDirection: 'row',
    },
  },
  rightContainer: {
    padding: '10%',
    [theme.breakpoints.up('md')]: {
      width: '50%',
    },
    backgroundColor: '#FFFFFF',
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: 'cover',
  },
  leftContainer: {
    padding: '10%',
    [theme.breakpoints.up('md')]: {
      width: '50%',
    },
  },
  info: {
    marginRight: '8px',
    marginTop: '5px',
  },
}));

export default () => {
  const classes = useStyles();

  const history = useHistory();

  const redirectToLogin = () => history.push(Routes.Login);

  return (
    <Page isAutoHeight={false}>
      <Box container display='flex' minHeight='100%' className={classes.pageContainer}>
        <Box className={classes.leftContainer}>
          <Typography variant='subtitle1' color='' className={classes.blueText}>
            Health Care Access Program
          </Typography>
          <Box mb={3}>
            <Typography variant='h2'>Welcome to Employer Portal</Typography>
          </Box>
          <Typography mb={2}>
            The Health Career Access Program (HCAP) is a paid work and training initiative for
            individuals seeking an entry point to employment in health. New hires will start as a
            Health Care Support Worker providing non-direct care at a long-term care or assisted
            living site and receive paid training to become a Health Care Assistant upon successful
            completion of the program. <br />
            HCAP has many benefits for employers who will have the opportunity to access new
            provincially funded staffing and training resource.
          </Typography>

          <Box p={4} mt={2} className={classes.blueBox}>
            <Box mb={2}>
              <Typography className={classes.blueText}>
                <InfoIcon className={classes.info} color='inherit' fontSize='small' />
                If you have any questions, please contact the Health Career Access Program at:{' '}
                <b>HCAPInfoQuery@gov.bc.ca</b>
              </Typography>
            </Box>
          </Box>
        </Box>
        <Box className={classes.rightContainer}>
          <Box mb={3}>
            <Typography variant='h2'>
              <b>Login</b>
            </Typography>
          </Box>
          <Box mb={3}>
            <Typography variant='body1'>
              You can use your IDIR or Business / Basic BCeID account to login into Health Care
              Access Program Employer Portal.
            </Typography>
          </Box>
          <Box mb={2}>
            <Button
              className={classes.button}
              onClick={redirectToLogin}
              fullWidth={false}
              variant='contained'
              color='primary'
              style={{ 'text-transform': 'none' }}
              text={'Login'}
            />
          </Box>
        </Box>
      </Box>
    </Page>
  );
};
