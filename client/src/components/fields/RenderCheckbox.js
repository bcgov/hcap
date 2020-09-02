import React, { Fragment } from 'react';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import { ErrorMessage } from 'formik';

import { InputFieldError } from '../generic';

export const RenderCheckbox = ({
  field,
  form,
  label,
  ...props
}) => {
  return (
    <Fragment>
      <FormControlLabel
        label={label}
        labelPlacement="end"
        control={
          <Checkbox
            color="primary"
            checked={field.value === true}
          />
        }
        {...field}
        {...props}
      />
      <InputFieldError error={<ErrorMessage name={field.name} />} />
    </Fragment>
  );
};
