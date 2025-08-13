import React, { Fragment } from 'react';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import { ErrorMessage } from 'formik';
import { InputFieldLabel, InputFieldError } from '../generic';

export const RenderCheckboxGroup = ({ field, form, label, options, ...props }) => {
  return (
    <Fragment>
      {label && <InputFieldLabel label={label} />}
      {options.map((option) => (
        <FormControlLabel
          key={option.value}
          sx={{
            display: 'flex',
            justifyContent: 'left',
          }}
          label={<InputFieldLabel label={option.label} />}
          control={
            <Checkbox
              color='primary'
              value={option.value}
              checked={Boolean(field?.value?.includes(option.value))}
            />
          }
          {...field}
          {...props}
        />
      ))}
      <InputFieldError error={<ErrorMessage name={field.name} />} />
    </Fragment>
  );
};
