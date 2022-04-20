import React, { Fragment } from 'react';
import MenuItem from '@material-ui/core/MenuItem';
import { ErrorMessage } from 'formik';

import { InputFieldError, InputFieldLabel } from '../generic';
import { Select } from '@material-ui/core';

export const RenderMultiSelectField = ({ field, form, label, options, placeholder, ...props }) => {
  const touched = form.touched[field.name];
  const error = form.errors[field.name];
  const defaultPlaceholder = placeholder || 'Please Select';

  const renderValue = (selecteds) => {
    const labels = selecteds.map(
      (selected) => options.find((option) => option.value === selected)?.label
    );
    if (labels.length > 0) {
      return labels.map((item, index) => <div key={index}>{item}</div>);
    }
    return defaultPlaceholder;
  };

  return (
    <Fragment>
      {label && <InputFieldLabel label={label} />}
      <Select
        {...field}
        multiple
        renderValue={renderValue}
        fullWidth
        variant='filled'
        error={touched && !!error}
        inputProps={{ displayEmpty: true }}
        value={field.value || []}
        {...props}
      >
        <MenuItem value='' disabled>
          {defaultPlaceholder}
        </MenuItem>
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
      <InputFieldError error={<ErrorMessage name={field.name} />} />
    </Fragment>
  );
};
