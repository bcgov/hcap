import React, { Fragment, } from 'react';
import Alert from '@material-ui/lab/Alert';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Link from '@material-ui/core/Link';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { FastField } from 'formik';

import { Card } from '../generic';
import { RenderCheckbox } from '../fields';

export const SectionFive = ({ isDisabled }) => {
  return (
    <Card noPadding={isDisabled} noShadow={isDisabled}>
      <Grid container spacing={3}>

        {!isDisabled && (
          <Fragment>
            {/** First Block */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" paragraph>
                If workers become ill at the farm
              </Typography>
            </Grid>
          </Fragment>
        )}

        {/** Second Block */}
        <Grid item xs={12}>

          {!isDisabled && (
            <Fragment>
              <Typography variant="subtitle2" paragraph>
                Plan to manage individuals suspected with COVID-19 infection
              </Typography>
              <Typography variant="body1" paragraph>
                Farm operators must have an infection control protocol to deal with workers demonstrating symptoms
                of COVID-19 (fever, cough, sore throat), including immediate self-isolation of the worker and notifying
                the local health authority.
              </Typography>
              <Typography>
                If there is an outbreak where two or more workers becomes sick, you must notify the local&nbsp;
                <Link
                  href="https://www2.gov.bc.ca/gov/content/health/about-bc-s-health-care-system/office-of-the-provincial-health-officer/medical-health-officers"
                  rel="noreferrer noopener"
                  target="_blank"
                >
                  Medical Health Officer
                </Link>
                &nbsp;of the outbreak.
              </Typography>
            </Fragment>
          )}

          <FastField
            name="hasFacilitiesToSeparateAndSelfIsolate"
            component={RenderCheckbox}
            label="I have the facilities to promptly separate and self-isolate the individual from others in their own accommodation."
            disabled={isDisabled}
          />
          <FastField
            name="isPreparedToProvideIndividualsExhibitingSymptoms"
            component={RenderCheckbox}
            label="I am prepared to provide individuals exhibiting symptoms of COVID-19 with a surgical/procedural mask or tissues to cover their mouth and nose."
            disabled={isDisabled}
          />
          <FastField
            name="isPreparedToDirectPersonToHealthLinkBC"
            component={RenderCheckbox}
            label="I am prepared to direct the person to call HealthLinkBC (8-1-1)."
            disabled={isDisabled}
          />
          <FastField
            name="isPreparedToCleanAndDisinfectRooms"
            component={RenderCheckbox}
            label="I am prepared to clean and disinfect any rooms that the person has been in while symptomatic."
            disabled={isDisabled}
          />
          <FastField
            name="isWillingToInformManagementAboutCommercialAccommodation"
            component={RenderCheckbox}
            label="If commercial accommodation is being used to self-isolate, then I will inform management of the situation and necessary requirements."
            disabled={isDisabled}
          />
        </Grid>

        {/** Third Block */}
        {!isDisabled && (
          <Grid item xs={12}>
            <Box mb={3}>
              <Alert severity="warning">
                <Typography variant="body2">
                  <b>
                    As COVID-19 recommendations are evolving daily, please keep up-to-date with&nbsp;
                    <Link
                      href="http://www.bccdc.ca/health-info/diseases-conditions/covid-19"
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      BC Centre for Disease Control guidance.
                    </Link>
                  </b>
                </Typography>
              </Alert>
            </Box>

            <Box mt={1.5} mb={3.5}>
              <Typography variant="subtitle2" paragraph>
                Provide food for ill workers
              </Typography>
              <FastField
                name="isAbleToProvideFoodInSafeManner"
                component={RenderCheckbox}
                label="I am able to provide food in a safe manner to a self-isolated worker."
                disabled={isDisabled}
              />
              <ExpansionPanel>
                <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="body1">
                    <b>What does this mean?</b>
                  </Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                  <ul>
                    <li>
                      <Typography variant="body1">
                        Gloves are not required when delivering or picking up food trays.
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body1">
                        Proper hand hygiene must be practiced before delivering and after picking up food trays.
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body1">
                        Do NOT enter a room to deliver or pick up food trays for workers who are ill. Deliver and
                        pick up food trays from outside their door.
                      </Typography>
                    </li>
                  </ul>
                </ExpansionPanelDetails>
              </ExpansionPanel>
            </Box>

            <Box mb={3.5}>
              <Typography variant="subtitle2" paragraph>
                Housekeeping for ill-workers
              </Typography>
              <FastField
                name="isAbleToPerformAdequateHousekeeping"
                component={RenderCheckbox}
                label="I am able to perform adequate housekeeping for a self-isolated worker."
                disabled={isDisabled}
              />
              <ExpansionPanel>
                <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="body1">
                    <b>What does this mean?</b>
                  </Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                  <ul>
                    <li>
                      <Typography variant="body1">
                        Site operators must identify and record the locations of all self-isolating guests.
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body1">
                        Do NOT provide cleaning service inside rooms where people are in self-isolation.
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body1">
                        Ensure staff do NOT enter self-isolation rooms until authorized.
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body1">
                        Use alternate means of assisting workers in isolation, such as leaving fresh linens,
                        toiletries and cleaning supplies outside the door during the period of isolation.
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body1">
                        Once the individual(s) in self-isolation have left a room, complete a thorough cleaning
                        of all hard surfaces with an approved disinfectant, launder all removable cloth items (sheets, towels).
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body1">
                        Discard all personal soap and shampoo remnants.
                      </Typography>
                    </li>
                  </ul>
                </ExpansionPanelDetails>
              </ExpansionPanel>
            </Box>

            <Box mb={3.5}>
              <Typography variant="subtitle2" paragraph>
                Waste management for ill-workers
              </Typography>

              <FastField
                name="isAbleToPerformWasteManagement"
                component={RenderCheckbox}
                label="I am able to perform waste management for supporting a self-isolated worker."
                disabled={isDisabled}
              />
              <ExpansionPanel>
                <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="body1">
                    <b>What does this mean?</b>
                  </Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                  <ul>
                    <li>
                      <Typography variant="body1">
                        Wherever possible, waste from all self-isolation rooms should be handled by a designated person
                        or small, designated team.
                      </Typography>
                    </li>
                  </ul>
                </ExpansionPanelDetails>
              </ExpansionPanel>
            </Box>
          </Grid>
        )}
      </Grid>
    </Card>
  );
};
