import React, { Fragment } from 'react';
import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';
import { ErrorMessage } from 'formik';

import { InputFieldError, InputFieldLabel } from '../generic';

export const RenderSelectField = ({
  field: { value, name, ...fieldRest },
  form,
  label,
  options,
  boldLabel,
  ...props
}) => {
  const touched = form.touched[fieldRest.name];
  const error = form.errors[fieldRest.name];
  return (
    <Fragment>
      {label && <InputFieldLabel label={label} boldLabel={boldLabel} />}
      <TextField
        select
        fullWidth
        variant='filled'
        error={touched && !!error}
        inputProps={{ displayEmpty: true }}
        value={value || ''}
        name={name}
        {...fieldRest}
        {...props}
      >
        <MenuItem value='' disabled>
          {props.placeholder || 'Please select'}
        </MenuItem>
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
      <InputFieldError error={<ErrorMessage name={name} />} />
    </Fragment>
  );
};
