import React from 'react';
import { Grid } from '@material-ui/core';
import { FastField } from 'formik';
import { RenderTextField } from '../../fields';
import { SectionHeader } from '../SectionHeader';

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
    </>
  );
};
