import React, { Fragment } from 'react';
import { styled } from '@mui/material/styles';
import ButtonGroup from '@mui/material/ButtonGroup';
import classNames from 'classnames';
import { ErrorMessage, useField } from 'formik';

import { InputFieldError, Button } from '../generic';

const PREFIX = 'RenderButtonGroup';

const classes = {
  button: `${PREFIX}-button`,
  buttonError: `${PREFIX}-buttonError`,
};

// TODO jss-to-styled codemod: The Fragment root was replaced by div. Change the tag if needed.
const Root = styled('div')(({ theme }) => ({
  [`& .${classes.button}`]: {
    boxShadow: 'none',
  },

  [`& .${classes.buttonError}`]: {
    borderColor: theme.palette.error.main,
    '&:hover': {
      borderColor: theme.palette.error.main,
    },
  },
}));

export const RenderButtonGroup = ({ field, form, options, ...props }) => {
  const [, , helpers] = useField(field.name);
  const { setValue } = helpers;
  const error = form.errors[field.name];
  return (
    <Root>
      <ButtonGroup orientation='vertical' fullWidth {...props}>
        {options.map((option) => (
          <Button
            className={classNames(classes.button, { [classes.buttonError]: !!error })}
            key={option.value}
            onClick={() => setValue(option.value)}
            variant={option.value === field.value ? 'contained' : 'outlined'}
            color={option.value === field.value ? option.color : 'primary'}
            text={option.label}
          />
        ))}
      </ButtonGroup>
      <InputFieldError error={<ErrorMessage name={field.name} />} />
    </Root>
  );
};
