import React, { Fragment } from 'react';
import Alert from '@material-ui/lab/Alert';
import Box from '@material-ui/core/Box';
import Link from '@material-ui/core/Link';
import PhoneIcon from '@material-ui/icons/Phone';
import Typography from '@material-ui/core/Typography';

import { Divider } from '../generic';

const BeforeYouBegin = () => {
  return (
    <Fragment>
      <Typography variant="h2" color="primary" gutterBottom>
        Employer Expression of Interest (EOI)
      </Typography>
      <Divider />

      <Box mt={3} mb={2}>
        <Alert severity="info" icon={<PhoneIcon />}>
          <Typography variant="body2" gutterBottom>
            <b>
              If you need assistance, please contact a Health Career Access Program agent for help.
            </b>
          </Typography>
          <Typography variant="body2" component="span">
            <b>
              Toll-free:&nbsp;
              <Link href="tel:+18773740463">
                1-877-374-0463
              </Link>
            </b>
          </Typography>
          <Typography variant="body2" component="span">
            <b>
              &nbsp;| Service is available from 8:00 am – 4:30 pm Pacific Time
            </b>
          </Typography>
        </Alert>
      </Box>

      <Typography variant="body1" paragraph>
        This Expression of Interest does not commit employers to participation in the Health Career Access Program.
        Rather, the form is a first step for employers who want to be considered or are interested in knowing more
        about the HCAP opportunity. After the form has been submitted, operators will be contacted with more
        information and next steps.
      </Typography>
      <Typography variant="body1" paragraph>
        Operators must complete&nbsp;
        <b>one Expression of Interest form for each site</b>
         &nbsp;that may be interested in participating in the Health Career Access Program.
      </Typography>

    </Fragment>
  );
};

export { BeforeYouBegin };
