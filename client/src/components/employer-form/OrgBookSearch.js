import React, { useState, Fragment } from 'react';
import fetch from 'cross-fetch';
import Box from '@material-ui/core/Box';
import CircularProgress from '@material-ui/core/CircularProgress';
import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { ErrorMessage } from 'formik';

import { InputFieldError, InputFieldLabel } from '../generic';

export const OrgBookSearch = ({
  field: { name, value, onChange, onBlur },
  form,
  label,
  ...props
}) => {
  const [isLoading, setLoading] = useState(false);
  const [options, setOptions] = useState([]);

  const touched = form.touched[name];
  const error = form.errors[name];

  const searchOrgbook = async (value) => {
    if (!value || value.length < 1) return;

    setLoading(true);

    const response = await fetch(
      `https://orgbook.gov.bc.ca/api/v2/search/autocomplete?q=${encodeURIComponent(
        value
      )}&inactive=false&latest=true&revoked=false`
    );

    // There will only ever be 1 result in the names array
    const entries = await response.json();
    const mappedEntries = entries.results.map((entry) => entry.names[0].text);

    setLoading(false);
    setOptions(mappedEntries);
  };

  return (
    <Fragment>
      {label && <InputFieldLabel label={label} />}
      <Autocomplete
        freeSolo
        options={options}
        loading={isLoading}
        onBlur={onBlur}
        onInputChange={(event, value) => {
          onChange({ target: { name, value } });
          searchOrgbook(value);
        }}
        value={value || ''}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder='Start typing to search the OrgBook database. If your business name does not appear, please enter your business name manually.'
            variant='filled'
            error={touched && !!error}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <Fragment>
                  {!isLoading ? (
                    params.InputProps.endAdornment
                  ) : (
                    <Box pl={1.5} pr={1.5}>
                      <CircularProgress color='inherit' size={20} />
                    </Box>
                  )}
                </Fragment>
              ),
            }}
          />
        )}
        {...props}
      />
      <InputFieldError error={<ErrorMessage name={name} />} />
    </Fragment>
  );
};
