import React from 'react';
import Typography from '@material-ui/core/Typography';
import { Page, Button } from '../../components/generic';
import Box from '@material-ui/core/Box';
import { Routes } from '../../constants';
import { useHistory } from 'react-router-dom';
import InfoIcon from '@material-ui/icons/Info';
import Link from '@material-ui/core/Link';
import { employerLoginPageStyle } from '../../utils';

const useStyles = employerLoginPageStyle({ withRightContainerBackground: true });

const HCAP_LINK =
  'https://www2.gov.bc.ca/gov/content/employment-business/job-seekers-employees/find-a-job/health-care';

export default () => {
  const classes = useStyles();

  const history = useHistory();

  const redirectToLogin = () => history.push(Routes.Login);

  return (
    <Page isAutoHeight={false}>
      <Box container display='flex' minHeight='100%' className={classes.pageContainer}>
        <Box className={classes.leftContainer}>
          <Typography variant='subtitle1' className={classes.blueText}>
            Health Care Access Program
          </Typography>
          <Box mb={3}>
            <Typography variant='h2'>Welcome to Employer Portal</Typography>
          </Box>
          <Typography>
            The Health Career Access Program (HCAP) is a paid work and training initiative for
            individuals seeking an entry point to employment in health. New hires will start as a
            Health Care Support Worker providing non-direct care at a long-term care or assisted
            living site and receive paid training to become a Health Care Assistant upon successful
            completion of the program. <br />
            HCAP has many benefits for employers who will have the opportunity to access new
            provincially funded staffing and training resource.
          </Typography>
          <br />
          <Link href={HCAP_LINK}>
            <Typography variant='subtitle2'>Learn more about the program</Typography>
          </Link>

          <Box
            container
            display='flex'
            flexDirection='row'
            p={2}
            mt={1}
            className={classes.blueBox}
          >
            <Box p={1}>
              <InfoIcon className={classes.info} color='inherit' fontSize='small' />
            </Box>
            <Box>
              <Typography className={classes.blueText}>
                If you have any questions, please contact the Health Career Access Program at:
              </Typography>
              <Typography className={classes.blueText}>
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
          <Box container display='flex' className={classes.bottomBox}>
            <Box p={1}>
              <InfoIcon className={classes.info} />
            </Box>
            <Box pt={2}>
              <Typography>
                If you are participant{' '}
                <Link href='#' onClick={redirectToLogin}>
                  {' '}
                  click here
                </Link>{' '}
                to login
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Page>
  );
};
