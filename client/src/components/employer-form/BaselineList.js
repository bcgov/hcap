import React, { Fragment } from 'react';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Typography from '@material-ui/core/Typography';
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import { InputFieldError, InputFieldLabel } from '../generic';
import { Divider, Grid } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import { useFormikContext } from 'formik';

const useStyles = makeStyles((theme) => ({
  dividerSpacing: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(2),
  },
  dividerTextSpacing: {
    marginTop: theme.spacing(2),
  },
}));

export const BaselineList = ({
  field: { name, value, onChange, onBlur },
  form,
  label,
  options,
  disabled,
  ...props
}) => {
  const { setFieldValue } = useFormikContext();

  const setValue = (option, result) => {
    const mergedResult = { ...value, [option.value]: result }
    setFieldValue(name, mergedResult);
  };

  const classes = useStyles();
  const error = form.errors[name];

  const sanitizeValue = (value) => {
    if (value === '') return value;
    return typeof value === 'undefined' ? '' : Number(value);
  }

  return (
    <Fragment>
      {options.map((option) => (
        !disabled &&
        <Fragment key={option.value}>
          <Accordion
            defaultExpanded={true}
            disabled={disabled}
            {...props}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Grid container justify="space-between">
                <Grid item>
                  <Typography variant="body1">
                    <b>
                      {option.label}
                    </b>
                  </Typography>
                </Grid>
              </Grid>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container direction="column">
                <Typography variant="body1" color="primary">Current Staff (Headcount)</Typography>
                <Divider className={classes.dividerSpacing} />
                <Grid container justify="space-between">
                  <Grid item>
                    <InputFieldLabel label="* Full Time" />
                    <TextField
                      variant="filled"
                      fullWidth
                      type="number"
                      value={sanitizeValue(value[option.value]?.currentFullTime)}
                      onChange={(e) => setValue(option, {
                        ...value[option.value],
                        currentFullTime: sanitizeValue(e.target.value),
                      })}
                      disabled={disabled}
                      {...props}
                    />
                    {error && <InputFieldError
                      error={error[option.value]?.currentFullTime} />}
                  </Grid>
                  <Grid item>
                    <InputFieldLabel label="* Part Time" />
                    <TextField
                      variant="filled"
                      fullWidth
                      type="number"
                      value={sanitizeValue(value[option.value]?.currentPartTime)}
                      onChange={(e) => setValue(option, {
                        ...value[option.value],
                        currentPartTime: sanitizeValue(e.target.value),
                      })}
                      disabled={disabled}
                      {...props}
                    />
                    {error && <InputFieldError
                      error={error[option.value]?.currentPartTime} />}
                  </Grid>
                  <Grid item>
                    <InputFieldLabel label="* Casual" />
                    <TextField
                      variant="filled"
                      fullWidth
                      type="number"
                      value={sanitizeValue(value[option.value]?.currentCasual)}
                      onChange={(e) => setValue(option, {
                        ...value[option.value],
                        currentCasual: sanitizeValue(e.target.value),
                      })}
                      disabled={disabled}
                      {...props}
                    />
                    {error && <InputFieldError
                      error={error[option.value]?.currentCasual} />}
                  </Grid>
                </Grid>
                <Grid container direction="column">
                  <Typography className={classes.dividerTextSpacing}
                    variant="body1" color="primary">Current Vacancies (Headcount)</Typography>
                  <Divider className={classes.dividerSpacing} />
                  <Grid container justify="space-between">
                    <Grid item>
                      <InputFieldLabel label="* Full Time" />
                      <TextField
                        variant="filled"
                        fullWidth
                        type="number"
                        value={sanitizeValue(value[option.value]?.vacancyFullTime)}
                        onChange={(e) => setValue(option, {
                          ...value[option.value],
                          vacancyFullTime: sanitizeValue(e.target.value),
                        })}
                        disabled={disabled}
                        {...props}
                      />
                      {error && <InputFieldError
                        error={error[option.value]?.vacancyFullTime} />}
                    </Grid>
                    <Grid item>
                      <InputFieldLabel label="* Part Time" />
                      <TextField
                        variant="filled"
                        fullWidth
                        type="number"
                        value={sanitizeValue(value[option.value]?.vacancyPartTime)}
                        onChange={(e) => setValue(option, {
                          ...value[option.value],
                          vacancyPartTime: sanitizeValue(e.target.value),
                        })}
                        disabled={disabled}
                        {...props}
                      />
                      {error && <InputFieldError
                        error={error[option.value]?.vacancyPartTime} />}
                    </Grid>
                    <Grid item>
                      <InputFieldLabel label="* Casual" />
                      <TextField
                        variant="filled"
                        fullWidth
                        type="number"
                        value={sanitizeValue(value[option.value]?.vacancyCasual)}
                        onChange={(e) => setValue(option, {
                          ...value[option.value],
                          vacancyCasual: sanitizeValue(e.target.value),
                        })}
                        disabled={disabled}
                        {...props}
                      />
                      {error && <InputFieldError
                        error={error[option.value]?.vacancyCasual} />}
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Fragment>
      ))}
    </Fragment>
  );
};
