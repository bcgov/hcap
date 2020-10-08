import React, { Fragment } from 'react';
import Box from '@material-ui/core/Box';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Typography from '@material-ui/core/Typography';

import { Divider } from '../generic';

const Summary = ({ isDisabled }) => {
  return (
    <Fragment>
      <Typography variant="h2" color="primary" gutterBottom>
        Employer Expression of Interest (EOI)
      </Typography>
      <Divider />

      <Box pt={2}>
        {/** First Block */}
        <ExpansionPanel defaultExpanded={!isDisabled}>
          <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="body1">
              <b>
                Value Proposition: Resources available to employers through the HCAP
              </b>
            </Typography>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails>
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
          </ExpansionPanelDetails>
        </ExpansionPanel>

        {/** Second Block */}
        <ExpansionPanel defaultExpanded={!isDisabled}>
          <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="body1">
              <b>
                Expectations for HCAP-participating employers
              </b>
            </Typography>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails>
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
          </ExpansionPanelDetails>
        </ExpansionPanel>
      </Box>
    </Fragment>
  );
};

export { Summary };
