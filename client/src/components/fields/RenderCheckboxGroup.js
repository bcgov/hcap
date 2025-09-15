import React, { Fragment } from 'react';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import { ErrorMessage } from 'formik';
import { InputFieldLabel, InputFieldError } from '../generic';

export const RenderCheckboxGroup = ({ field, form, label, options, ...props }) => {
  const handleChange = (optionValue, isChecked) => {
    const currentValues = field.value || [];
    let newValues;

    if (isChecked) {
      // Add the value if it's not already in the array
      newValues = currentValues.includes(optionValue)
        ? currentValues
        : [...currentValues, optionValue];
    } else {
      // Remove the value from the array
      newValues = currentValues.filter((value) => value !== optionValue);
    }

    form.setFieldValue(field.name, newValues);
    // Ensure field is marked as touched for validation
    form.setFieldTouched(field.name, true, false);
  };

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
              onChange={(event) => handleChange(option.value, event.target.checked)}
              onBlur={() => form.setFieldTouched(field.name, true)}
              name={`${field.name}.${option.value}`}
            />
          }
          {...props}
        />
      ))}
      <InputFieldError error={<ErrorMessage name={field.name} />} />
    </Fragment>
  );
};
