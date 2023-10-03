import React from 'react';
import { Grid } from '@material-ui/core';
import { FastField } from 'formik';
import { RenderRadioGroup, RenderTextField } from '../../fields';
import { Question } from '../Question';
import { SectionHeader } from '../SectionHeader';
import { YesNoPreferNot } from '../../../constants';
import { PleaseNoteBanner } from '../PleaseNoteBanner';

const contactFields = [
  { name: 'firstName', label: '4. * First Name' },
  { name: 'lastName', label: '5. * Last Name' },
  { name: 'phoneNumber', label: '6. * Phone Number', type: 'tel' },
  { name: 'emailAddress', label: '7. * Email Address', type: 'email' },
  { name: 'postalCode', label: '8. * Postal Code' },
];

export const ContactInformationSection = ({ checkFieldDisability }) => {
  return (
    <>
      <SectionHeader text='Provide Your Contact Information' />
      {contactFields.map(({ name, label, type }) => (
        <Grid item xs={12} sm={6} key={name}>
          <FastField
            name={name}
            component={RenderTextField}
            label={label}
            type={type ?? 'text'}
            disabled={checkFieldDisability(name)}
          />
        </Grid>
      ))}
      <PleaseNoteBanner
        text='The following information is collected as some employers may
              prioritize hiring of indigenous candidates or candidates with a drivers license in
              certain circumstances.'
      />

      {/** Q9 do you self identify as indigenous */}
      <Question text='9. Do you self-identify as First Nation, Métis, Inuk (Inuit) or Urban Indigenous?' />
      <Grid item xs={12}>
        <FastField
          name='indigenous'
          component={RenderRadioGroup}
          disabled={checkFieldDisability('indigenous')}
          setTouched
          row
          options={YesNoPreferNot}
        />
      </Grid>
    </>
  );
};
