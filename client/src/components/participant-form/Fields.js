import React, { useState } from 'react';
import Grid from '@material-ui/core/Grid';
import Link from '@material-ui/core/Link';
import Collapse from '@material-ui/core/Collapse';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import { FastField } from 'formik';

import { Card, Divider } from '../generic';
import { RenderCheckbox, RenderCheckboxGroup, RenderTextField, RenderRadioGroup } from '../fields';

const useStyles = makeStyles((theme) => ({
  line: {
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(3),
    borderTop: '2px solid rgb(204, 204, 204)',
  },
}));

export const Fields = ({ isDisabled }) => {
  const classes = useStyles();
  const [isCollectionNoticeExpanded, setCollectionNoticeExpanded] = useState(window.innerWidth > 750);

  return (
    <Card noShadow={isDisabled}>
      <Grid container spacing={2}>

        {/** Eligibility */}
        <Grid item xs={12}>
          <Typography variant="subtitle2">
            Check Your Eligibility
          </Typography>
          <Divider />
        </Grid>
        <Grid item xs={12}>
          <Typography>
            <b>Please note:</b> A criminal record check is required for most positions in the health sector.
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography>
            <b>* Are you a Canadian citizen or permanent resident?</b>
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <FastField
            name="eligibility"
            component={RenderRadioGroup}
            disabled={isDisabled}
            setTouched
            row
            options={[
              { value: true, label: 'Yes' },
              { value: false, label: 'No' },
            ]}
          />
        </Grid>

        {/** Contact Info */}
        <Grid item xs={12}>
          <Typography variant="subtitle2">
            Provide Your Contact Information
          </Typography>
          <Divider />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FastField
            name="firstName"
            component={RenderTextField}
            label="* First Name"
            disabled={isDisabled}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FastField
            name="lastName"
            component={RenderTextField}
            label="* Last Name"
            disabled={isDisabled}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FastField
            name="phoneNumber"
            type="tel"
            component={RenderTextField}
            label="* Phone Number"
            disabled={isDisabled}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FastField
            name="emailAddress"
            type="email"
            component={RenderTextField}
            label="* Email Address"
            disabled={isDisabled}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FastField
            name="postalCode"
            component={RenderTextField}
            label="* Postal Code"
            disabled={isDisabled}
          />
        </Grid>

        {/** Preferred Work Location */}
        <Grid item xs={12}>
          <Typography variant="subtitle2">
            Select Your Preferred Work Location(s)
          </Typography>
          <Divider />
        </Grid>
        <Grid item xs={12}>
          <FastField
            name="preferredLocation"
            component={RenderCheckboxGroup}
            label="* Please select your preferred health region(s)"
            disabled={isDisabled}
            options={[
              {
                value: 'Interior', label: (
                  <span>
                    Interior (
                    <Link
                      href="https://www2.gov.bc.ca/assets/gov/data/geographic/land-use/administrative-boundaries/health-boundaries/1_interior_health_authority.pdf"
                      target="__blank"
                      rel="noreferrer noopener"
                    >
                      PDF map
                  </Link>
                  )
                  </span>
                )
              },
              {
                value: 'Fraser', label: (
                  <span>
                    Fraser (
                    <Link
                      href="https://www2.gov.bc.ca/assets/gov/data/geographic/land-use/administrative-boundaries/health-boundaries/2_fraser_health_authority.pdf"
                      target="__blank"
                      rel="noreferrer noopener"
                    >
                      PDF map
                  </Link>
                  )
                  </span>
                )
              },
              {
                value: 'Vancouver Coastal', label: (
                  <span>
                    Vancouver Coastal (
                    <Link
                      href="https://www2.gov.bc.ca/assets/gov/data/geographic/land-use/administrative-boundaries/health-boundaries/3_vancouver_coastal_health_authority.pdf"
                      target="__blank"
                      rel="noreferrer noopener"
                    >
                      PDF map
                  </Link>
                  )
                  </span>
                )
              },
              {
                value: 'Vancouver Island', label: (
                  <span>
                    Vancouver Island (
                    <Link
                      href="https://www2.gov.bc.ca/assets/gov/data/geographic/land-use/administrative-boundaries/health-boundaries/4_vancouver_island_health_authority.pdf"
                      target="__blank"
                      rel="noreferrer noopener"
                    >
                      PDF map
                  </Link>
                  )
                  </span>
                )
              },
              {
                value: 'Northern', label: (
                  <span>
                    Northern (
                    <Link
                      href="https://www2.gov.bc.ca/assets/gov/data/geographic/land-use/administrative-boundaries/health-boundaries/5_northern_health_authority.pdf"
                      target="__blank"
                      rel="noreferrer noopener"
                    >
                      PDF map
                  </Link>
                  )
                  </span>
                )
              },
            ]}
          />
        </Grid>
      </Grid>

      {/** Disclaimer and submission */}
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <hr className={classes.line} />
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FastField
                name="consent"
                disabled={isDisabled}
                component={RenderCheckbox}
                label="I consent to have my personal information shared with the Health Career Access Program."
              />
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body1" gutterBottom>
            <b>Collection Notice</b>
          </Typography>
          <Typography variant="body2" paragraph>
            Personal information is collected via this form under&nbsp;
            <Link
              href="https://www.bclaws.ca/civix/document/id/complete/statreg/96165_03#section26"
              target="__blank"
              rel="noreferrer noopener"
            >
              sections 26(c) and (e) of the Freedom of Information and Protection of Privacy Act
            </Link>
            &nbsp;(FOIPPA) for the purposes of administering the Health Career Access Program.
          </Typography>
          <Collapse in={isCollectionNoticeExpanded || isDisabled}>
            <Typography variant="body2" paragraph>
              Personal information will only be used by authorized personnel to fulfill the purpose for
              which it was originally collected or for a use consistent with that purpose unless you
              expressly consent otherwise. We do not disclose your information to other public bodies or
              individuals except as authorized by FOIPPA.
            </Typography>
            <Typography variant="body2" paragraph>
              If you have any questions about our collection or use of personal information, please direct
              your inquiries to the Director, Planning, Integration and Partnerships, 1515 Blanshard Street,
              Victoria, British Columbia, V8W 3C8. Telephone: <Link href="tel:+12364783520">236-478-3520</Link>,
              Email: <Link href="mailto:HCAPInfoQuery@gov.bc.ca">HCAPInfoQuery@gov.bc.ca</Link>.
            </Typography>
          </Collapse>
          {
            !isDisabled && <Box
              mt={0.25}
              style={{ cursor: 'pointer', textDecoration: 'underline' }}
              onClick={() => setCollectionNoticeExpanded(prevState => !prevState)}
            >
              {!isCollectionNoticeExpanded ? 'Show More' : 'Show Less'}
            </Box>
          }
        </Grid>
        {!isDisabled && <Grid item xs={12}>
          <Typography variant="body1" gutterBottom>
            <b>Submit Your Form</b>
          </Typography>
          <Typography variant="body2" paragraph>
            Use the submit button to complete your expression of interest. We will contact you within 3
            weeks with more information.
          </Typography>
          <Typography variant="body1" gutterBottom>
            <b>Need Help?</b>
          </Typography>
          <Typography variant="body2" paragraph>
            Contact a Health Career Access Program agent.
            <br />
            <Link href="tel:+18773740463">
              Dial 1-877-374-0463
            </Link>
            <br />
            <b>Service is available from 8:00 am - 4:30 pm Pacific Time</b>
          </Typography>
        </Grid>}
      </Grid>
    </Card>
  );
};
