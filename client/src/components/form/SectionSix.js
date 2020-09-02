import React, { Fragment, } from 'react';
import Alert from '@material-ui/lab/Alert';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Link from '@material-ui/core/Link';
import EditIcon from '@material-ui/icons/Edit';
import { FastField } from 'formik';

import { SectionOne } from './SectionOne';
import { SectionTwo } from './SectionTwo';
import { SectionThree } from './SectionThree';
import { SectionFour } from './SectionFour';
import { SectionFive } from './SectionFive';
import { Button, Card } from '../generic';
import { RenderCheckbox } from '../fields';

export const SectionSix = ({ handleEditClick, isDisabled }) => {
  return (
    <Fragment>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <Box mb={2}>
              <Grid container alignItems="center" justify="space-between" spacing={2}>
                <Grid item>
                  <Typography variant="subtitle1">
                    1. Declarations
                  </Typography>
                </Grid>
              </Grid>
            </Box>
            <SectionOne isDisabled />
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card>
            <Box mb={2}>
              <Grid container alignItems="center" justify="space-between" spacing={2}>
                <Grid item>
                  <Typography variant="subtitle1">
                    2. Your business contact information
                  </Typography>
                </Grid>
                {!isDisabled && (
                  <Grid item>
                    <Button
                      startIcon={<EditIcon />}
                      fullWidth={false}
                      size="small"
                      onClick={() => handleEditClick(1)}
                      text="Edit"
                    />
                  </Grid>
                )}
              </Grid>
            </Box>
            <SectionTwo isDisabled />
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card>
            <Box mb={2}>
              <Grid container alignItems="center" justify="space-between" spacing={2}>
                <Grid item>
                  <Typography variant="subtitle1">
                    3. Before workers arrive at your farm, please certify
                  </Typography>
                </Grid>
                {!isDisabled && (
                  <Grid item>
                    <Button
                      startIcon={<EditIcon />}
                      fullWidth={false}
                      size="small"
                      onClick={() => handleEditClick(2)}
                      text="Edit"
                    />
                  </Grid>
                )}
              </Grid>
            </Box>
            <SectionThree isDisabled />
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card>
            <Box mb={2}>
              <Grid container alignItems="center" justify="space-between" spacing={2}>
                <Grid item>
                  <Typography variant="subtitle1">
                    4. After temporary foreign workers arrive at your farm
                  </Typography>
                </Grid>
                {!isDisabled && (
                  <Grid item>
                    <Button
                      startIcon={<EditIcon />}
                      fullWidth={false}
                      size="small"
                      onClick={() => handleEditClick(3)}
                      text="Edit"
                    />
                  </Grid>
                )}
              </Grid>
            </Box>
            <SectionFour isDisabled />
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card>
            <Box mb={2}>
              <Grid container alignItems="center" justify="space-between" spacing={2}>
                <Grid item>
                  <Typography variant="subtitle1">
                    5. If workers become ill at the farm
                  </Typography>
                </Grid>
                {!isDisabled && (
                  <Grid item>
                    <Button
                      startIcon={<EditIcon />}
                      fullWidth={false}
                      size="small"
                      onClick={() => handleEditClick(4)}
                      text="Edit"
                    />
                  </Grid>
                )}
              </Grid>
            </Box>
            <SectionFive isDisabled />
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <Typography variant="subtitle2" paragraph>
              After submitting this application you will be subject to a site inspection:
            </Typography>
            <ul>
              <li>
                <Typography variant="body1">
                  You <b>will be subject to a site inspection</b> of your farm work sites and accommodations prior
                  to the release of temporary foreign workers after their mandatory 14 day quarantine period.
                </Typography>
              </li>
              <li>
                <Typography variant="body1">
                  The Province of BC will use the information you provide through this online form for the
                  site inspection that determines your compliance and readiness to receive workers.
                </Typography>
              </li>
            </ul>

            <Box mt={2} mb={3}>
              <Alert severity="warning">
                <Typography variant="body2" gutterBottom>
                  <b>
                    You must not employ a temporary foreign worker without passing an inspection by an approved
                    health officer or an infection prevention and control officer.
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

            <FastField
              name="doesCertify"
              component={RenderCheckbox}
              label="I certify this information to be accurate"
              disabled={isDisabled}
            />
            <FastField
              name="doesAgree"
              component={RenderCheckbox}
              label="I agree that my farm will be subject to a site inspection"
              disabled={isDisabled}
            />

            <Box mt={3} mb={3}>
              <Typography variant="subtitle2">
                Collection Notice
              </Typography>
              <Typography variant="caption" color="textSecondary">
                <br />
                Your personal information may be collected by the Ministry of Health under the authority of
                sections 26(a), (c), (e) and indirectly collected by the Ministry of Agriculture under the
                authority of section 27(1)(a)(iii) of the Freedom of Information and Protection of Privacy
                Act, the Public Health Act and the federal Quarantine Act, for the purposes of reducing the
                spread of COVID-19. Should you have any questions or concerns about the collection of your
                personal information please contact:
                <br />
                Title: Ministry of Health, Chief Privacy Officer
                <br />
                Address: 3rd floor – 1483 Douglas Street Victoria BC V8W 9P1                
                <br />
                Telephone: 236-478-1666
              </Typography>
            </Box>

          </Card>
        </Grid>
      </Grid>
    </Fragment>
  );
};
