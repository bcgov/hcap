import React, { Fragment } from 'react';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import { ErrorMessage } from 'formik';
import { makeStyles } from "@material-ui/core/styles"
import { InputFieldLabel, InputFieldError } from '../generic';

const useStyles = makeStyles({
  root: {
    display: "flex",
    justifyContent: "left",
  },
})

export const RenderCheckboxGroup = ({
  field,
  form,
  label,
  options,
  ...props
}) => {
  const classes = useStyles()
  return (
    <Fragment>
      {label && <InputFieldLabel label={label} />}
      {options.map((option) => (
        <FormControlLabel
          key={option.value}
          classes={classes}
          label={<InputFieldLabel label={option.label} />}
          control={
            <Checkbox
              color="primary"
              value={option.value}
              checked={field.value.includes(option.value)}
            />
          }
          {...field}
          {...props}
        />
      ))}
      <InputFieldError error={<ErrorMessage name={field.name} />} />
    </Fragment>
  );
};
