import React, { Fragment } from 'react';
import Alert from '@material-ui/lab/Alert';
import Box from '@material-ui/core/Box';
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Link from '@material-ui/core/Link';
import PhoneIcon from '@material-ui/icons/Phone';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

import { Divider } from '../generic';

const useStyles = makeStyles((theme) => ({
  root: {
    flexDirection: 'column',
  },
}));

const Summary = () => {

  const classes = useStyles();

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

      {/** First Block */}
      <Accordion defaultExpanded={true}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="body1">
            <b>
              Value Proposition: Resources available to employers through the HCAP
            </b>
          </Typography>
        </AccordionSummary>
        <AccordionDetails className={classes.root}>
          <Typography variant="body1" paragraph>
            Health Career Access Program (HCAP)-participating employers will receive:
          </Typography>
          <ul>
            <li>
              <Typography variant="body1" gutterBottom>
                Funding to hire a set number of non-clinical, non-direct care Health Care Support Workers (HCSW) who will
                provide critical support to patients, residents, and staff.
              </Typography>
              <ul>
                <li>
                  <Typography variant="body1" gutterBottom>
                    Qualified candidates will be referred to the HCAP-employer as the end-result of a provincial expression
                    of interest process.
                  </Typography>
                </li>
                <li>
                  <Typography variant="body1" gutterBottom>
                    Standard hiring processes will apply, and employers may receive applications from outside the
                    participant EOI. The participant EOI will act as an employer aid to recruitment.
                  </Typography>
                </li>
                <li>
                  <Typography variant="body1" gutterBottom>
                    Allocation of resources will be determined by health authorities through whom all funding will flow.
                  </Typography>
                </li>
              </ul>
            </li>
            <li>
              <Typography variant="body1" gutterBottom>
                Provincially standardized HCSW training and onboarding materials. Administrative and other costs associated
                with delivery of training and onboarding materials will be fully covered through HCAP funding.
              </Typography>
            </li>
            <li>
              <Typography variant="body1" gutterBottom>
                The opportunity to supply on-the-job training opportunities for new HCAs, thereby facilitating continuity of care
                for residents and patients and reducing churn.
              </Typography>
            </li>
          </ul>
        </AccordionDetails>
      </Accordion>

      {/** Second Block */}
      <Accordion defaultExpanded={true}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="body1">
            <b>
              Expectations for HCAP-participating employers
              </b>
          </Typography>
        </AccordionSummary>
        <AccordionDetails className={classes.root}>
          <Typography variant="body1" paragraph>
            The expression of interest (EOI) form is not a legal contract and does not commit the employer to any of the below-
            listed expectations or to any additional expectations which may be established at a later date. Employers who are
            interested in knowing more about the HCAP are encouraged to submit an EOI.
            </Typography>
          <Typography variant="body1" paragraph>
            Employers participating in the HCAP will be expected to:
          </Typography>
          <ul>
            <li>
              <Typography variant="body1" gutterBottom>
                Complete a regular interviewing and hiring process to ensure that screened and qualified candidates are a
                good fit for the individual site.
              </Typography>
            </li>
            <li>
              <Typography variant="body1" gutterBottom>
                Submit periodic workforce and vacancy updates.
              </Typography>
            </li>
          </ul>
          <Typography variant="body1">
            As this is a new initiative, operators will also be required to report out on the status of HCSW positions on their site.
            The data will be used to measure the success of the initiative, track the status of individuals in the HCSW role, and to
            distribute funding. Further detail on the required data elements will be communicated by Health Authorities as the
            initiative roles out.
          </Typography>
        </AccordionDetails>
      </Accordion>
    </Fragment>
  );
};

export { Summary };
