import React from 'react';
import { styled } from '@mui/material/styles';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import { ErrorMessage } from 'formik';
import { InputFieldLabel, InputFieldError } from '../generic';

const PREFIX = 'RenderCheckboxGroup';

const classes = {
  root: `${PREFIX}-root`,
};

// TODO jss-to-styled codemod: The Fragment root was replaced by div. Change the tag if needed.
const Root = styled('div')({
  [`& .${classes.root}`]: {
    display: 'flex',
    justifyContent: 'left',
  },
});

export const RenderCheckboxGroup = ({ field, form, label, options, ...props }) => {
  return (
    <Root>
      {label && <InputFieldLabel label={label} />}
      {options.map((option) => (
        <FormControlLabel
          key={option.value}
          classes={classes}
          label={<InputFieldLabel label={option.label} />}
          control={
            <Checkbox
              color='primary'
              value={option.value}
              checked={Boolean(field?.value?.includes(option.value))}
            />
          }
          {...field}
          {...props}
        />
      ))}
      <InputFieldError error={<ErrorMessage name={field.name} />} />
    </Root>
  );
};
