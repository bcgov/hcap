import React, { Fragment } from 'react';
import Alert from '@material-ui/lab/Alert';
import Box from '@material-ui/core/Box';
import Link from '@material-ui/core/Link';
import Typography from '@material-ui/core/Typography';

import { Card, Divider } from '../generic';

const BeforeYouBegin = () => {
  return (
    <Fragment>
      <Box mb={2}>
        <Alert severity='info'>
          <Typography variant='body2' gutterBottom>
            <b>
              If you have any questions, please contact the Health Career Access Program at:&nbsp;
              <Link href='mailto:HCAPInfoQuery@gov.bc.ca'>HCAPInfoQuery@gov.bc.ca</Link>
            </b>
          </Typography>
        </Alert>
      </Box>

      <Box mb={2}>
        <Card>
          <Typography variant='subtitle2' gutterBottom>
            The Health Career Access Program
          </Typography>
          <Divider />
          <Typography variant='body1'>
            The Health Career Access Program (HCAP) is a paid work and training initiative for
            individuals seeking an entry point to employment in health. New hires will start as a
            Health Care Support Worker providing non-direct care at a long-term care or assisted
            living site and receive paid training to become a Health Care Assistant upon successful
            completion of the program.
          </Typography>
          <br />
          <Typography variant='body1'>
            HCAP has many benefits for employers who will have the opportunity to access new
            provincially funded staffing and training resources and play a key role in building
            capacity in the BC health sector and economy.
          </Typography>
          <br />
          <Typography variant='body1'>
            Participating employers will be provided with funding to cover education and salary
            costs for hire Health Care Support Workers who will provide critical non-clinical
            support while enrolled in a new modular Health Care Assistant training program. The HCAP
            will roll out as a partnership between candidates and employers to work through
            onboarding, orientation, employer-based training, and the HCA employer- sponsored
            training program.
          </Typography>
          <br />
          <Typography variant='body1'>
            <b>
              The Employer Expression of Interest is available to operators of long-term care and/or
              assisted living sites with both public and privately funded beds.
            </b>
          </Typography>
        </Card>
      </Box>

      <Box>
        <Card>
          <Typography variant='subtitle2' gutterBottom>
            Employer Expression of Interest (EOI)
          </Typography>
          <Divider />
          <Typography variant='body1' paragraph>
            Submission of an EOI does not commit employers to participation in the Health Career
            Access Program. Rather, the form is a first step for employers who want to be considered
            or are interested in knowing more about the HCAP opportunity. After the form has been
            submitted, operators will be contacted with more information and next steps.
          </Typography>
          <Typography variant='body1' paragraph>
            Operators must complete&nbsp;
            <b>one Expression of Interest form for each site</b>
            &nbsp;that may be interested in participating in the Health Career Access Program.
          </Typography>
          <Typography variant='body1' paragraph>
            <b>
              Thank you for your interest in the Health Career Access Program. This current round of
              submissions will be open until March 2, 2021. Your submission will be assessed and an
              HCAP team member will be in contact with the results within two weeks of the close
              date.
            </b>
          </Typography>
          <Typography variant='body1' paragraph>
            We appreciate your interest in participating and we encourage you to reach out with any
            questions to:&nbsp;
            <Link href='mailto:HCAPInfoQuery@gov.bc.ca'>HCAPInfoQuery@gov.bc.ca</Link>
          </Typography>
        </Card>
      </Box>
    </Fragment>
  );
};

export { BeforeYouBegin };
