import React, { useState } from 'react';
import Grid from '@material-ui/core/Grid';
import Link from '@material-ui/core/Link';
import Collapse from '@material-ui/core/Collapse';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import { FastField } from 'formik';
import { SpeakerNotesOutlined } from '@material-ui/icons';
import { Checkbox, FormControl, FormControlLabel } from '@material-ui/core';
import { isNil } from 'lodash';

import { Card, Divider } from '../generic';
import { RenderCheckbox, RenderRadioGroup } from '../fields';
import {
  indigenousIdentities,
  indigenousIdentityLabels,
} from '../modal-forms/IndigenousDeclarationForm';
import { BC_LAWS_LINK, HCAP_INFO_EMAIL } from '../../constants';
import { PleaseNoteBanner } from './PleaseNoteBanner';
import { HCAPProgramSection } from './sections/HCAPProgramSection';
import { EligibilitySection } from './sections/EligibilitySection';
import { ContactInformationSection } from './sections/ContactInformationSection';
import { OtherSection } from './sections/OtherSection';
import { PreferredWorkLocation } from './sections/PreferredWorkLocation';
import { MarketingSection } from './sections/MarketingSection';
import { BackgroundInformationSection } from './sections/BackgroundInformationSection';

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

const contactFields = [
  { name: 'firstName', label: '4. * First Name' },
  { name: 'lastName', label: '5. * Last Name' },
  { name: 'phoneNumber', label: '6. * Phone Number', type: 'tel' },
  { name: 'emailAddress', label: '7. * Email Address', type: 'email' },
  { name: 'postalCode', label: '8. * Postal Code' },
];

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
  const hideReasonForFindingOut =
    !values?.reasonForFindingOut && checkFieldDisability('reasonForFindingOut');
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
              <a rel='noreferrer' target='_blank' href={`mailto:${HCAP_INFO_EMAIL}`}>
                {HCAP_INFO_EMAIL}
              </a>
            </Typography>
            <Typography variant='body2'>
              Service is available from 8:00 am - 4:30 pm Pacific Time Monday through Friday,
              excluding statutory holidays.
            </Typography>
          </Box>
        </Box>
      )}
      <Box mb={4} mt={3}>
        <PleaseNoteBanner
          text='The following information is shared with employers for the purposes of
                recruitment.'
        />
      </Box>

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
          {/** HCAP Program Section */}
          <HCAPProgramSection checkFieldDisability={checkFieldDisability} />

          {/** Eligibility Section */}
          {isSubmitted && isNonPortalHire && isNil(values.eligibility) ? null : (
            <EligibilitySection checkFieldDisability={checkFieldDisability} />
          )}

          {/** Contact Info Section */}
          <ContactInformationSection checkFieldDisability={checkFieldDisability} />

          {/** Other Section */}
          <OtherSection
            checkFieldDisability={checkFieldDisability}
            isMHAWProgram={values.program === 'MHAW'}
          />

          {/** Preferred Work Location Section */}
          <PreferredWorkLocation checkFieldDisability={checkFieldDisability} />

          {/** Marketing Section */}
          {!hideReasonForFindingOut && (
            <MarketingSection checkFieldDisability={checkFieldDisability} />
          )}

          {/** Background Information Section */}
          <BackgroundInformationSection
            checkFieldDisability={checkFieldDisability}
            isMHAWProgram={values.program === 'MHAW'}
            selectedOption={values.currentOrMostRecentIndustry}
          />
        </Grid>

        {/** Q14 Background information */}
        <SectionHeader text='Background Information' />
        <Question
          text='14. What industry do you currently or most recently work in? Please select the most
              applicable option.'
        />
        <Grid item xs={12}>
          <FastField
            name='currentOrMostRecentIndustry'
            component={RenderRadioGroup}
            disabled={checkFieldDisability('currentOrMostRecentIndustry')}
            setTouched
            options={[
              {
                value: 'Accommodation and food services',
                label: 'Accommodation and food services',
              },
              {
                value: 'Administrative and support, waste management and remediation services ',
                label: 'Administrative and support, waste management and remediation services ',
              },
              {
                value: 'Agriculture, forestry, fishing, and hunting',
                label: 'Agriculture, forestry, fishing, and hunting',
              },
              {
                value: 'Arts, entertainment, and recreation',
                label: 'Arts, entertainment, and recreation',
              },
              {
                value: 'Community Social Services',
                label: 'Community Social Services',
              },
              {
                value: 'Construction',
                label: 'Construction',
              },
              {
                value: 'Continuing Care and Community Health Care',
                label: 'Continuing Care and Community Health Care',
              },
              {
                value: 'Educational services',
                label: 'Educational services',
              },
              {
                value: 'Finance and insurance',
                label: 'Finance and insurance',
              },
              {
                value: 'Health care and social assistance',
                label: 'Health care and social assistance',
              },
              {
                value: 'Information and cultural industries',
                label: 'Information and cultural industries',
              },
              {
                value: 'Management of companies and enterprises',
                label: 'Management of companies and enterprises',
              },
              {
                value: 'Manufacturing',
                label: 'Manufacturing',
              },
              {
                value: 'Mining, quarrying, and oil and gas extraction',
                label: 'Mining, quarrying, and oil and gas extraction',
              },
              {
                value: 'Professional, scientific, and technical services',
                label: 'Professional, scientific, and technical services',
              },
              {
                value: 'Public administration',
                label: 'Public administration',
              },
              {
                value: 'Real estate and rental and leasing',
                label: 'Real estate and rental and leasing',
              },
              {
                value: 'Retail trade',
                label: 'Retail trade',
              },
              {
                value: 'Transportation and warehousing',
                label: 'Transportation and warehousing',
              },
              {
                value: 'Tourism & Hospitality',
                label: 'Tourism & Hospitality',
              },
              {
                value: 'Utilities',
                label: 'Utilities',
              },
              {
                value: 'Wholesale trade',
                label: 'Wholesale trade',
              },
              {
                value: 'None, not working previously',
                label: 'None, not working previously',
              },
              {
                value: 'Other, please specify:',
                label: 'Other, please specify:',
              },
            ]}
          />
        </Grid>
        {values.currentOrMostRecentIndustry === 'Other, please specify:' && (
          <Grid item xs={6}>
            <FastField
              name='otherIndustry'
              component={RenderTextField}
              disabled={checkFieldDisability('otherIndustry')}
            />
          </Grid>
        )}
        {/** Q15 does/ did this rolee involve delivering mental health/ substance use services */}
        {/** only show if Q1 is MHAW and Q14 is one of 3 below options */}
        {values.program === 'MHAW' &&
          (values.currentOrMostRecentIndustry === 'Health care and social assistance' ||
            values.currentOrMostRecentIndustry === 'Continuing Care and Community Health Care' ||
            values.currentOrMostRecentIndustry === 'Community Social Services') && (
            <>
              <Question
                text='15. Does/did this role involve delivering mental health and/or substance use
                    services?'
              />
              <Grid item xs={12}>
                <FastField
                  name='roleInvolvesMentalHealthOrSubstanceUse'
                  component={RenderRadioGroup}
                  disabled={checkFieldDisability('roleInvolvesMentalHealthOrSubstanceUse')}
                  setTouched
                  row
                  options={YesNo}
                />
              </Grid>
            </>
          )}

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
              <Link href={BC_LAWS_LINK} target='__blank' rel='noreferrer noopener'>
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
                <Link href={`mailto:${HCAP_INFO_EMAIL}`}>{HCAP_INFO_EMAIL}</Link>.
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
