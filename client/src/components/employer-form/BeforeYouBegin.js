import React, { Fragment } from 'react';
import Alert from '@material-ui/lab/Alert';
import Box from '@material-ui/core/Box';
import Link from '@material-ui/core/Link';
import PhoneIcon from '@material-ui/icons/Phone';
import Typography from '@material-ui/core/Typography';

import { Card, Divider } from '../generic';

const BeforeYouBegin = () => {
  return (
    <Fragment>

      <Box mb={2}>
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

      <Box mb={2}>
        <Card>
          <Typography variant="subtitle2" gutterBottom>
            The Health Career Access Program
          </Typography>
          <Divider/>
          <Typography variant="body1">
            The Health Career Access Program (HCAP) is a 12-month paid work and training initiative for individuals seeking an entry point to employment in health. New hires will start as a Health Care Support Worker providing non-direct care at a long-term care or assisted living site and receive paid training to become a Health Care Assistant upon successful completion of the program.
          </Typography>
          <br />
          <Typography variant="body1">
            A significant number of applicants have already expressed interest in the program through the provincial expression of interest - <Link href="https://www2.gov.bc.ca/gov/content/economic-recovery/work-in-health-care" target="_blank">(https://www2.gov.bc.ca/gov/content/economic-recovery/work-in-health-care)</Link>. As HCAP positions are posted externally, a provincial matching process will connect these individuals to employers that are hiring.
          </Typography>
          <br />
          <Typography variant="body1">
            HCAP has many benefits for employers who will have the opportunity to access new provincially funded staffing and training resources and play a key role in building capacity in the BC health sector and economy.
          </Typography>
          <br />
          <Typography variant="body1">
            Participating employers will be provided with funding to cover education and salary costs for hire Health Care Support Workers who will provide critical non-clinical support while enrolled in a new modular Health Care Assistant training program.
          </Typography>
          <br />
          <Typography variant="body1">
          <b>
            The Employer Expression of Interest is available to operators of long-term care and/or assisted living sites with publicly funded beds.
          </b>
          </Typography>
        </Card>
      </Box>

      <Box>
        <Card>
          <Typography variant="subtitle2" gutterBottom>
            Employer Expression of Interest (EOI)
          </Typography>
          <Divider/>
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
        </Card>
      </Box>

    </Fragment>
  );
};

export { BeforeYouBegin };
