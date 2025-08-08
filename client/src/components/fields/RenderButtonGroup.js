import React, { Fragment } from 'react';
import ButtonGroup from '@mui/material/ButtonGroup';
import { styled } from '@mui/material/styles';
import { ErrorMessage, useField } from 'formik';

import { InputFieldError, Button } from '../generic';

const StyledButton = styled(Button)(({ theme, hasError }) => ({
  boxShadow: 'none',
  ...(hasError && {
    borderColor: theme.palette.error.main,
    '&:hover': {
      borderColor: theme.palette.error.main,
    },
  }),
}));

export const RenderButtonGroup = ({ field, form, options, ...props }) => {
  const [, , helpers] = useField(field.name);
  const { setValue } = helpers;
  const error = form.errors[field.name];
  return (
    <Fragment>
      <ButtonGroup orientation='vertical' fullWidth {...props}>
        {options.map((option) => (
          <StyledButton
            hasError={!!error}
            key={option.value}
            onClick={() => setValue(option.value)}
            variant={option.value === field.value ? 'contained' : 'outlined'}
            color={option.value === field.value ? option.color : 'primary'}
            text={option.label}
          />
        ))}
      </ButtonGroup>
      <InputFieldError error={<ErrorMessage name={field.name} />} />
    </Fragment>
  );
};
