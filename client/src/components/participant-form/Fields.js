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
            isMHAW={values.program === 'MHAW'}
            selectedOption={values.currentOrMostRecentIndustry}
          />
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
