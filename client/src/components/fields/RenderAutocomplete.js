import React, { Fragment } from 'react';
import Autocomplete from '@material-ui/lab/Autocomplete';
import TextField from '@material-ui/core/TextField';
import { makeStyles } from "@material-ui/core/styles"
import { ErrorMessage, useFormikContext } from 'formik';

import { InputFieldError, InputFieldLabel } from '../generic';

const useStyles = makeStyles({
  inputRoot: {
    display: "flex",
    justifyContent: "left",
    paddingTop: '0 !important',
  },
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

  const { setFieldValue } = useFormikContext();

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
            inputProps={{
              ...params.inputProps,
              autoComplete: 'new-password',
              placeholder: 'Please Select'
            }}
            variant="filled"
          />
        )}
      />
      <InputFieldError error={<ErrorMessage name={name} />} />
    </Fragment>
  );
};
