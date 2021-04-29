import React, { Fragment } from 'react';
import Autocomplete from '@material-ui/lab/Autocomplete';
import TextField from '@material-ui/core/TextField';
import { makeStyles } from "@material-ui/core/styles"
import { ErrorMessage } from 'formik';

import { InputFieldError, InputFieldLabel } from '../generic';

const useStyles = makeStyles({
  inputRoot: {
    paddingTop: '0 !important',
  },
  option: {
    backgroundColor: 'white !important',
    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.04) !important',
    }
  }
})

export const RenderAutocomplete = ({
  field: { value, name },
  form,
  label,
  options,
}) => {
  const classes = useStyles()
  const touched = form.touched[name];
  const error = form.errors[name];
  const { setFieldValue } = form;

  return (
    <Fragment>
      {label && <InputFieldLabel label={label} />}
      <Autocomplete
        classes={classes}
        options={options}
        getOptionLabel={(option) => option?.label || ''}
        getOptionSelected={(option, value) => value === '' || option.value === value.value}
        value={options.find((option) => option.value === value) || ''}
        onChange={(_, value) => setFieldValue(name, value?.value || '')}
        renderInput={(params) => (
          <TextField
            {...params}
            error={touched && !!error}
            variant="filled"
            inputProps={{
              ...params.inputProps,
              autoComplete: 'none',
              placeholder: 'Please Select'
            }}
          />
        )}
      />
      <InputFieldError error={<ErrorMessage name={name} />} />
    </Fragment>
  );
};
