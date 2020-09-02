import React, { Fragment } from 'react';
import Alert from '@material-ui/lab/Alert';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import Link from '@material-ui/core/Link';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import PhoneIcon from '@material-ui/icons/Phone';
import { FastField } from 'formik';

import { Card, Divider } from '../generic';
import { RenderCheckbox } from '../fields';

export const SectionOne = ({ isDisabled }) => {
  return (
    <Card noPadding={isDisabled} noShadow={isDisabled}>
      {!isDisabled && (
        <Fragment>
          <Typography variant="subtitle1" paragraph>
            Apply for authorization from the BC Provincial Health Officer to receive temporary foreign
            workers at your workplace and protect workers during the COVID-19 pandemic
          </Typography>
          <Typography variant="body1" paragraph>
            Farm operators must ensure a safe workplace for their workers and demonstrate proof of a
            COVID-19 Infection Prevention and Control (IPC) protocol. While you have workers on the farm,
            you are still subject to all provincial laws and regulations.
          </Typography>

          {/** First Block */}
          <Typography variant="subtitle2" paragraph>
            Before you complete this form:
          </Typography>
          <Divider />
          <Box pt={2} pb={2}>
            <ExpansionPanel>
              <Box pt={3.5} pb={3.5} pl={3} pr={3}>
                <Typography variant="body1" gutterBottom>
                  <b>1. Download and read the Province of BC's COVID-19 farm guidance document:</b>
                </Typography>
                <Typography variant="body1">
                  <Link
                    href="http://www.bccdc.ca/Health-Info-Site/Documents/COVID_public_guidance/All-sector-work-camps-guidance.pdf"
                    rel="noreferrer noopenner"
                    target="_blank"
                  >
                    Protecting Industrial Camp Workers, Contractors, and Employers Working in the Agricultural, Forestry, and Natural Resource Sectors During the COVID-19 Pandemic
                  </Link>
                </Typography>
              </Box>
            </ExpansionPanel>
            <ExpansionPanel>
              <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="body1">
                  <b>
                    2. Complete a COVID-19 risk assessment of your farm operation by following the
                    directions in the guidance document.
                  </b>
                </Typography>
              </ExpansionPanelSummary>
              <ExpansionPanelDetails>
                <Typography variant="body1" paragraph>
                  Assessing each section in the guidance document will help you identify areas
                  that do not sufficiently prevent or reduce the risk of COVID-19 transmission.
                </Typography>
                <Card style={{ backgroundColor: '#E6E8E9', padding: '18px', marginBottom: '16px' }} noShadow>
                  <Typography variant="body1" paragraph>
                    <b>Example: Physical Distancing Risk</b>
                  </Typography>
                  <Typography variant="body1" paragraph>
                    If workers need to be transported to the work site in vehicles where a 2m distance
                    cannot be maintained, this should be identified as a risk.
                  </Typography>
                  <Typography variant="body1">
                    Farm operators can take practical actions to reduce the risk of disease transmission
                    (see section 2, number 7 of the&nbsp;
                    <Link
                      href="http://www.bccdc.ca/Health-Info-Site/Documents/COVID_public_guidance/All-sector-work-camps-guidance.pdf"
                      rel="noreferrer noopener"
                      target="_blank"
                    >
                      guidance document
                    </Link>
                    ).
                  </Typography>
                </Card>
                <Typography variant="body1" paragraph>
                  Have you worked through all the sections in Protecting Industrial Camp Workers, Contractors, and Employers Working in the Agricultural, Forestry, and Natural Resource Sectors During the COVID-19 Pandemic to identify the risks at your farm?
                </Typography>
              </ExpansionPanelDetails>
            </ExpansionPanel>
            <ExpansionPanel>
              <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="body1">
                  <b>3. Create your COVID-19 Infection Prevention and Control (IPC) protocol.</b>
                </Typography>
              </ExpansionPanelSummary>
              <ExpansionPanelDetails>
                <Typography variant="body1" paragraph>
                  By following the guidance document you will be developing an Infection Prevention
                  and Control (IPC) protocol. For each section of the guide where you identified a risk,
                  the risk needs to be controlled.
                </Typography>
                <Card style={{ backgroundColor: '#E6E8E9', padding: '18px', marginBottom: '16px' }} noShadow>
                  <Typography variant="body1" paragraph>
                    <b>Example: Physical Distancing Control</b>
                  </Typography>
                  <Typography variant="body1">
                    If your workers ride together in a vehicle to the work site, and you follow the instructions
                    to increase cleaning and hygiene, and increase physical distancing, this will form your IPC
                    plan for transportation (see section 2, number 7 of the&nbsp;
                    <Link
                      href="http://www.bccdc.ca/Health-Info-Site/Documents/COVID_public_guidance/All-sector-work-camps-guidance.pdf"
                      rel="noreferrer noopener"
                      target="_blank"
                    >
                      guidance document
                    </Link>
                    ).
                  </Typography>
                </Card>
                <Typography variant="body1" paragraph>
                  Have you decided what is needed on your farm to prevent or control the risk of the transmission
                  of COVID-19?
                </Typography>
              </ExpansionPanelDetails>
            </ExpansionPanel>
          </Box>
          <Box mt={3} mb={4}>
            <Alert severity="info" icon={<PhoneIcon />}>
              <Typography variant="body2" gutterBottom>
                <b>
                  If you need assistance completing these risk assessment or infection prevention tasks, please
                  contact AgSafe for help.
                </b>
              </Typography>
              <Typography variant="body2" component="span">
                <b>
                  Toll-free:&nbsp;
                  <Link href="tel:+18775331789">
                    1-877-533-1789
                  </Link>
                </b>
              </Typography>
              <Typography variant="body2" component="span">
                <b>
                  &nbsp;| Email:&nbsp;
                  <Link href="mailto:Contact@AgSafeBC.ca">
                    Contact@AgSafeBC.ca
                  </Link>
                </b>
              </Typography>
            </Alert>
          </Box>

          {/** Second Block */}
          <Typography variant="subtitle2" paragraph>
            After submitting this application you will be subject to a site inspection:
          </Typography>
          <ul>
            <li>
              <Typography variant="body1" gutterBottom>
                You <b>will be subject to a site inspection</b> of your farm worksites and accommodations prior to the
                release of temporary foreign workers after their mandatory 14 day quarantine period.
              </Typography>
            </li>
            <li>
              <Typography variant="body1" gutterBottom>
                The Province of BC will use the information you provide through this online form for the site inspection
                that determines your compliance and readiness to receive workers.
              </Typography>
            </li>
            <li>
              <Typography variant="body1" gutterBottom>
                You <b>must</b> identify all sites temporary foreign workers will be going to – failure to do so will result in inspection delays.
              </Typography>
            </li>
            <li>
              <Typography variant="body1" gutterBottom>
                If you have already received a site inspection, but require an inspection at an additional site, you <b>must</b> contact your inspector to
                notify them of this additional site. Submitting your form does not automatically trigger an inspection. If you do not have your
                inspector’s email or phone number, please contact <Link href="mailto:AGRI.TFWProgram@gov.bc.ca">AGRI.TFWProgram@gov.bc.ca</Link>
              </Typography>
            </li>
            <li>
              <Typography variant="body1" gutterBottom>
                Employers who pass inspection before the date their workers are set to arrive, but fail to properly identify each farm site and accommodation
                site receiving workers will be <b>responsible for the hotel accommodation and food costs for each additional day</b> workers must be held
                back at the hotel until all sites pass inspection.
              </Typography>
            </li>
          </ul>
          <Box mt={4} mb={4}>
            <Alert severity="warning">
              <Typography variant="body2" gutterBottom>
                <b>
                  If you fail to comply with these requirements, the arrival of temporary foreign workers at your farm will
                  be delayed or denied.
                </b>
              </Typography>
              <Typography variant="body2">
                (source:&nbsp;
                <Link
                  href="https://www2.gov.bc.ca/assets/gov/health/about-bc-s-health-care-system/office-of-the-provincial-health-officer/covid-19/covid-19-pho-order-travellers-employers.pdf"
                  rel="noreferrer noopenner"
                  target="_blank"
                >
                  Order of the Provincial Health Officer / Travellers and Employers Order - April 14, 2020)
                </Link>
              </Typography>
            </Alert>
          </Box>
        </Fragment>
      )}

      {/** Third Block */}
      {!isDisabled && (
        <Typography variant="subtitle2" paragraph>
          To begin your application, please certify:
        </Typography>
      )}
      <FastField
        name="hasDownloadedBCMinistryAgricultureCovid19Requirements"
        component={RenderCheckbox}
        disabled={isDisabled}
        label={(
          <span>
            I have downloaded and read the Province of BC's COVID-19 requirements,&nbsp;
            <Link
              href="http://www.bccdc.ca/Health-Info-Site/Documents/COVID_public_guidance/All-sector-work-camps-guidance.pdf"
              rel="noreferrer noopenner"
              target="_blank"
            >
              Protecting Industrial Camp Workers, Contractors, and Employers Working in the Agricultural, Forestry, and Natural Resource Sectors During the COVID-19 Pandemic
            </Link>
          </span>
        )}
      />
      <FastField
        name="hasCompletedCovid19WorkplaceRiskAssessment"
        component={RenderCheckbox}
        label="I have completed a COVID-19 workplace risk assessment of my farm operation"
        disabled={isDisabled}
      />
      <FastField
        name="hasCreatedCovid19InfectionPreventionAndControlProtocol"
        component={RenderCheckbox}
        label="I have created a COVID-19 Infection Prevention and Control Protocol"
        disabled={isDisabled}
      />
    </Card>
  );
};
