import React, { Fragment } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { ErrorMessage } from 'formik';

import { InputFieldError, InputFieldLabel } from '../generic';

export const RenderAutocomplete = ({
  field: { value, name },
  form,
  label,
  options,
  boldLabel,
  onItemChange,
}) => {
  const touched = form.touched[name];
  const error = form.errors[name];
  const { setFieldValue } = form;

  return (
    <Fragment>
      {label && <InputFieldLabel label={label} boldLabel={boldLabel} />}
      <Autocomplete
        sx={{
          '& .MuiInputBase-root': {
            paddingTop: '0 !important',
          },
          '& .MuiAutocomplete-option': {
            backgroundColor: 'white !important',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04) !important',
            },
          },
        }}
        options={options}
        getOptionLabel={(option) => option?.label || ''}
        isOptionEqualToValue={(option, value) => value === '' || option.value === value.value}
        value={options.find((option) => option.value === value) || ''}
        onChange={(e, val) => {
          setFieldValue(name, val?.value || '');
          if (onItemChange) onItemChange(e, val);
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            error={touched && !!error}
            variant='filled'
            inputProps={{
              ...params.inputProps,
              autoComplete: 'none',
              placeholder: 'Please Select',
            }}
          />
        )}
      />
      <InputFieldError error={<ErrorMessage name={name} />} />
    </Fragment>
  );
};
