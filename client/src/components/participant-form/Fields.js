import React, { useState } from 'react';
import Grid from '@material-ui/core/Grid';
import Link from '@material-ui/core/Link';
import Collapse from '@material-ui/core/Collapse';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import { FastField } from 'formik';
import { SpeakerNotesOutlined } from '@material-ui/icons';

import { Card, Divider } from '../generic';
import { RenderCheckbox, RenderCheckboxGroup, RenderTextField, RenderRadioGroup } from '../fields';
import {
  indigenousIdentities,
  indigenousIdentityLabels,
} from '../modal-forms/IndigenousDeclarationForm';
import { Checkbox, FormControl, FormControlLabel } from '@material-ui/core';
import { isNil } from 'lodash';

const useStyles = makeStyles((theme) => ({
  info: {
    color: 'rgb(13, 60, 97)',
    backgroundColor: 'rgb(232, 244, 253)',
    borderRadius: '4px',
    border: '1px solid rgb(175, 217, 252)',
  },
  infoHeader: {
    fontSize: '16px',
    marginBottom: theme.spacing(1),
    fontWeight: 'bold',
  },
  infoIcon: {
    color: 'rgb(21, 153, 222)',
    fontSize: '80px',
    marginRight: theme.spacing(2),
  },
  line: {
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(3),
    borderTop: '2px solid rgb(204, 204, 204)',
  },
}));

export const Fields = ({
  isDisabled,
  hideHelp,
  enableFields,
  isNonPortalHire,
  values,
  isSubmitted,
}) => {
  const classes = useStyles();
  const [isCollectionNoticeExpanded, setCollectionNoticeExpanded] = useState(
    window.innerWidth > 750
  );
  const checkFieldDisability = (key) =>
    isDisabled || (enableFields ? !enableFields.includes(key) : false);
  return (
    <>
      {!hideHelp && (
        <Box mb={2} py={1} px={2} display='flex' alignItems='center' className={classes.info}>
          <SpeakerNotesOutlined className={classes.infoIcon} />
          <Box py={1}>
            <Typography className={classes.infoHeader} component='h3'>
              Need Help?
            </Typography>
            <Typography variant='body2'>
              Contact a Health Career Access Program agent at{' '}
              <a rel='noreferrer' target='_blank' href='mailto:HCAPInfoQuery@gov.bc.ca'>
                HCAPInfoQuery@gov.bc.ca
              </a>
            </Typography>
            <Typography variant='body2'>
              Service is available from 8:00 am - 4:30 pm Pacific Time Monday through Friday
            </Typography>
          </Box>
        </Box>
      )}

      <Card noShadow={isDisabled}>
        {/** Indigenous Identity - meant to be READ-ONLY, not set up for editing */}
        <Grid container spacing={2}>
          {isSubmitted && !isNil(values.isIndigenous) && (
            <Grid item xs={12}>
              <Typography variant='subtitle2'>Indigenous Identity</Typography>
              <Divider />

              <Box display='flex' flexDirection='column'>
                <FormControl component='fieldset'>
                  <FormControl component='legend'>
                    <Typography variant='subtitle2'>
                      Do you identify as an Indigenous Person?
                    </Typography>
                  </FormControl>

                  <FastField
                    id='isIndigenous'
                    name='isIndigenous'
                    component={RenderRadioGroup}
                    disabled
                    row
                    options={[
                      { value: true, label: 'Yes' },
                      { value: false, label: 'No' },
                    ]}
                  />
                </FormControl>

                {values.indigenousIdentities.length > 0 ? (
                  <FormControl component='fieldset'>
                    <FormControl component='legend'>
                      <Typography variant='subtitle2'>What is your Indigenous Identity?</Typography>
                      <Typography>Choose all that apply</Typography>
                    </FormControl>
                    {Object.keys(indigenousIdentities)
                      .map((key) => ({
                        label: indigenousIdentityLabels[key],
                        value: indigenousIdentities[key],
                      }))
                      .map((item) => (
                        <FormControlLabel
                          key={item.value}
                          disabled
                          label={item.label}
                          labelPlacement='end'
                          control={
                            <Checkbox
                              sx={{ '& .MuiSvgIcon-root': { fontSize: 28 } }}
                              size='medium'
                              color='primary'
                              checked={values.indigenousIdentities?.includes(item.value)}
                            />
                          }
                        />
                      ))}
                  </FormControl>
                ) : null}
              </Box>
            </Grid>
          )}

          {/** Eligibility */}

          {isSubmitted && isNonPortalHire && isNil(values.eligibility) ? null : (
            <>
              <Grid item xs={12}>
                <Typography variant='subtitle2'>Check Your Eligibility</Typography>
                <Divider />
              </Grid>
              <Grid item xs={12}>
                <Typography>
                  <b>Please note:</b> A criminal record check is required for most positions in the
                  health sector.
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography>
                  <b>* Are you a Canadian citizen or permanent resident?</b>
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <FastField
                  name='eligibility'
                  component={RenderRadioGroup}
                  disabled={checkFieldDisability('eligibility')}
                  setTouched
                  row
                  options={[
                    { value: true, label: 'Yes' },
                    { value: false, label: 'No' },
                  ]}
                />
              </Grid>
            </>
          )}

          {/** Contact Info */}
          <Grid item xs={12}>
            <Typography variant='subtitle2'>Provide Your Contact Information</Typography>
            <Divider />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FastField
              name='firstName'
              component={RenderTextField}
              label='* First Name'
              disabled={checkFieldDisability('firstName')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FastField
              name='lastName'
              component={RenderTextField}
              label='* Last Name'
              disabled={checkFieldDisability('lastName')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FastField
              name='phoneNumber'
              type='tel'
              component={RenderTextField}
              label='* Phone Number'
              disabled={checkFieldDisability('phoneNumber')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FastField
              name='emailAddress'
              type='email'
              component={RenderTextField}
              label='* Email Address'
              disabled={checkFieldDisability('emailAddress')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FastField
              name='postalCode'
              component={RenderTextField}
              label='* Postal Code'
              disabled={checkFieldDisability('postalCode')}
            />
          </Grid>

          {/** Preferred Work Location */}
          <Grid item xs={12}>
            <Typography variant='subtitle2'>Select Your Preferred Work Location(s)</Typography>
            <Divider />
          </Grid>
          <Grid item xs={12}>
            <FastField
              name='preferredLocation'
              component={RenderCheckboxGroup}
              label='* Please select your preferred health region(s)'
              disabled={checkFieldDisability('preferredLocation')}
              options={[
                {
                  value: 'Interior',
                  label: (
                    <span>
                      Interior (
                      <Link
                        href='https://www2.gov.bc.ca/assets/gov/data/geographic/land-use/administrative-boundaries/health-boundaries/1_interior_health_authority.pdf'
                        target='__blank'
                        rel='noreferrer noopener'
                      >
                        PDF map
                      </Link>
                      )
                    </span>
                  ),
                },
                {
                  value: 'Fraser',
                  label: (
                    <span>
                      Fraser (
                      <Link
                        href='https://www2.gov.bc.ca/assets/gov/data/geographic/land-use/administrative-boundaries/health-boundaries/2_fraser_health_authority.pdf'
                        target='__blank'
                        rel='noreferrer noopener'
                      >
                        PDF map
                      </Link>
                      )
                    </span>
                  ),
                },
                {
                  value: 'Vancouver Coastal',
                  label: (
                    <span>
                      Vancouver Coastal (
                      <Link
                        href='https://www2.gov.bc.ca/assets/gov/data/geographic/land-use/administrative-boundaries/health-boundaries/3_vancouver_coastal_health_authority.pdf'
                        target='__blank'
                        rel='noreferrer noopener'
                      >
                        PDF map
                      </Link>
                      )
                    </span>
                  ),
                },
                {
                  value: 'Vancouver Island',
                  label: (
                    <span>
                      Vancouver Island (
                      <Link
                        href='https://www2.gov.bc.ca/assets/gov/data/geographic/land-use/administrative-boundaries/health-boundaries/4_vancouver_island_health_authority.pdf'
                        target='__blank'
                        rel='noreferrer noopener'
                      >
                        PDF map
                      </Link>
                      )
                    </span>
                  ),
                },
                {
                  value: 'Northern',
                  label: (
                    <span>
                      Northern (
                      <Link
                        href='https://www2.gov.bc.ca/assets/gov/data/geographic/land-use/administrative-boundaries/health-boundaries/5_northern_health_authority.pdf'
                        target='__blank'
                        rel='noreferrer noopener'
                      >
                        PDF map
                      </Link>
                      )
                    </span>
                  ),
                },
              ]}
            />
          </Grid>
        </Grid>

        {/** Disclaimer and submission */}
        <Grid container spacing={2}>
          {isSubmitted && isNonPortalHire && isNil(values.consent) ? null : (
            <Grid item xs={12}>
              <hr className={classes.line} />
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FastField
                    name='consent'
                    disabled={checkFieldDisability('consent')}
                    component={RenderCheckbox}
                    label='I consent to have my personal information shared with the Health Career Access Program.'
                  />
                </Grid>
              </Grid>
            </Grid>
          )}
          <Grid item xs={12}>
            <Typography variant='body1' gutterBottom>
              <b>Collection Notice</b>
            </Typography>
            <Typography variant='body2' paragraph>
              Personal information is collected via this form under&nbsp;
              <Link
                href='https://www.bclaws.ca/civix/document/id/complete/statreg/96165_03#section26'
                target='__blank'
                rel='noreferrer noopener'
              >
                sections 26(c) and (e) of the Freedom of Information and Protection of Privacy Act
              </Link>
              &nbsp;(FOIPPA) for the purposes of administering the Health Career Access Program.
            </Typography>
            <Collapse in={isCollectionNoticeExpanded || isDisabled}>
              <Typography variant='body2' paragraph>
                Personal information will only be used by authorized personnel to fulfill the
                purpose for which it was originally collected or for a use consistent with that
                purpose unless you expressly consent otherwise. We do not disclose your information
                to other public bodies or individuals except as authorized by FOIPPA.
              </Typography>
              <Typography variant='body2' paragraph>
                If you have any questions about our collection or use of personal information,
                please direct your inquiries to the Director, Planning, Integration and
                Partnerships, 1515 Blanshard Street, Victoria, British Columbia, V8W 3C8. Telephone:{' '}
                <Link href='tel:+12364783520'>236-478-3520</Link>, Email:{' '}
                <Link href='mailto:HCAPInfoQuery@gov.bc.ca'>HCAPInfoQuery@gov.bc.ca</Link>.
              </Typography>
            </Collapse>
            {!isDisabled && (
              <Box
                mt={0.25}
                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => setCollectionNoticeExpanded((prevState) => !prevState)}
              >
                {!isCollectionNoticeExpanded ? 'Show More' : 'Show Less'}
              </Box>
            )}
          </Grid>
          {!isDisabled && (
            <Grid item xs={12}>
              <Typography variant='body1' gutterBottom>
                <b>Submit Your Form</b>
              </Typography>
              <Typography variant='body2' paragraph>
                Use the submit button to complete your expression of interest.
              </Typography>
            </Grid>
          )}
        </Grid>
      </Card>
    </>
  );
};
