import React, { Fragment } from 'react';
import TextField from '@material-ui/core/TextField';
import { ErrorMessage } from 'formik';

import { InputFieldLabel, InputFieldError } from '../generic';

export const RenderTextField = ({
  field: { value, ...fieldRest },
  form,
  label,
  ...props
}) => {
  const touched = form.touched[fieldRest.name];
  const error = form.errors[fieldRest.name];

  const sanitizeValue = (value) => {
    if (value === null) return '';
    return typeof value === 'undefined' ? '' : value;
  }

  return (
    <Fragment>
      {label && <InputFieldLabel label={label} />}
      <TextField
        variant="filled"
        fullWidth
        error={touched && !!error}
        value={sanitizeValue(value)}
        {...fieldRest}
        {...props}
      />
      <InputFieldError error={<ErrorMessage name={fieldRest.name} />} />
    </Fragment>
  );
};
