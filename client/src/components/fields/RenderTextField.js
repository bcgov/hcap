import React, { Fragment } from 'react';
import TextField from '@material-ui/core/TextField';
import { ErrorMessage } from 'formik';

import { InputFieldLabel, InputFieldError } from '../generic';

export const RenderTextField = ({
  field: { value, name, ...fieldRest },
  form,
  label,
  type,
  ...props
}) => {
  const touched = form.touched[name];
  const error = form.errors[name];

  const sanitizeValue = (value) => {
    if (value === null) return '';
    return typeof value === 'undefined' ? '' : value;
  }

  return (
    <Fragment>
      <label htmlFor={name}>
        {label && <InputFieldLabel label={label} />}
      </label>
      <TextField
        id={name}
        name={name}
        variant="filled"
        type={type}
        onKeyDown={(e) => type === 'number' && ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
        fullWidth
        error={touched && !!error}
        value={sanitizeValue(value)}
        aria-required
        aria-invalid={!!error}
        aria-describedby={`${name}Error`}
        {...fieldRest}
        {...props}
      />
      <InputFieldError id={`${name}Error`} error={<ErrorMessage name={name} />} />
    </Fragment>
  );
};
