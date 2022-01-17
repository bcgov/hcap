import React, { Fragment } from 'react';
import { styled } from '@mui/material/styles';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { ErrorMessage } from 'formik';

import { InputFieldError, InputFieldLabel } from '../generic';

const PREFIX = 'RenderAutocomplete';

const classes = {
  inputRoot: `${PREFIX}-inputRoot`,
  option: `${PREFIX}-option`,
};

// TODO jss-to-styled codemod: The Fragment root was replaced by div. Change the tag if needed.
const Root = styled('div')({
  [`& .${classes.inputRoot}`]: {
    paddingTop: '0 !important',
  },
  [`& .${classes.option}`]: {
    backgroundColor: 'white !important',
    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.04) !important',
    },
  },
});

export const RenderAutocomplete = ({ field: { value, name }, form, label, options }) => {
  const touched = form.touched[name];
  const error = form.errors[name];
  const { setFieldValue } = form;

  return (
    <Root>
      {label && <InputFieldLabel label={label} />}
      <Autocomplete
        classes={classes}
        options={options}
        getOptionLabel={(option) => option?.label || ''}
        isOptionEqualToValue={(option, value) => value === '' || option.value === value.value}
        value={options.find((option) => option.value === value) || ''}
        onChange={(_, value) => setFieldValue(name, value?.value || '')}
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
    </Root>
  );
};
