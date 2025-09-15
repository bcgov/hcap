import React, { Fragment } from 'react';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import { ErrorMessage } from 'formik';

import { InputFieldError } from '../generic';

export const RenderCheckbox = ({ field, form, label, ...props }) => {
  const handleChange = (event) => {
    form.setFieldValue(field.name, event.target.checked);
  };

  return (
    <Fragment>
      <FormControlLabel
        label={label}
        labelPlacement='end'
        control={
          <Checkbox
            color='primary'
            checked={props['checked'] || field.value === true}
            onChange={handleChange}
            name={field.name}
          />
        }
        {...props}
      />
      <InputFieldError error={<ErrorMessage name={field.name} />} />
    </Fragment>
  );
};
