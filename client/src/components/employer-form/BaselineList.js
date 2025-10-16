import React, { Fragment } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Typography from '@mui/material/Typography';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import { InputFieldError, InputFieldLabel } from '../generic';
import { Divider, Grid, styled } from '@mui/material';
import TextField from '@mui/material/TextField';
import { useFormikContext } from 'formik';

const DividerSpacing = styled(Divider)(({ theme }) => ({
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(2),
}));

const DividerTextSpacing = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(2),
  variant: 'body1',
  color: 'primary',
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
    const mergedResult = { ...value, [option.value]: result };
    setFieldValue(name, mergedResult);
  };

  const error = form.errors[name];

  const sanitizeValue = (value) => {
    if (value === '') return value;
    return typeof value === 'undefined' ? '' : Number(value);
  };

  const getIndividualValue = (optionValue, property) => {
    const initialValue = Array.isArray(value) && value.find((item) => item.role === optionValue);
    const result = initialValue || value[optionValue];
    return sanitizeValue(result[property]);
  };

  return (
    <Fragment>
      {options.map((option) => (
        <Fragment key={option.value}>
          <Accordion defaultExpanded={true} disabled={disabled} {...props}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Grid container justify='space-between'>
                <Grid item>
                  <Typography variant='body1'>
                    <b>{option.label}</b>
                  </Typography>
                </Grid>
              </Grid>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container direction='column'>
                <Typography variant='body1' color='primary'>
                  Current Staff (Headcount)
                </Typography>
                <DividerSpacing />
                <Grid container justify='space-between'>
                  <Grid item>
                    <InputFieldLabel label='* Full Time' />
                    <TextField
                      variant='filled'
                      fullWidth
                      type='number'
                      value={getIndividualValue(option.value, 'currentFullTime')}
                      onChange={(e) =>
                        setValue(option, {
                          ...value[option.value],
                          currentFullTime: sanitizeValue(e.target.value),
                        })
                      }
                      disabled={disabled}
                      {...props}
                    />
                    {error && <InputFieldError error={error[option.value]?.currentFullTime} />}
                  </Grid>
                  <Grid item>
                    <InputFieldLabel label='* Part Time' />
                    <TextField
                      variant='filled'
                      fullWidth
                      type='number'
                      value={getIndividualValue(option.value, 'currentPartTime')}
                      onChange={(e) =>
                        setValue(option, {
                          ...value[option.value],
                          currentPartTime: sanitizeValue(e.target.value),
                        })
                      }
                      disabled={disabled}
                      {...props}
                    />
                    {error && <InputFieldError error={error[option.value]?.currentPartTime} />}
                  </Grid>
                  <Grid item>
                    <InputFieldLabel label='* Casual' />
                    <TextField
                      variant='filled'
                      fullWidth
                      type='number'
                      value={getIndividualValue(option.value, 'currentCasual')}
                      onChange={(e) =>
                        setValue(option, {
                          ...value[option.value],
                          currentCasual: sanitizeValue(e.target.value),
                        })
                      }
                      disabled={disabled}
                      {...props}
                    />
                    {error && <InputFieldError error={error[option.value]?.currentCasual} />}
                  </Grid>
                </Grid>
                <Grid container direction='column'>
                  <DividerTextSpacing>Current Vacancies (Headcount)</DividerTextSpacing>
                  <DividerSpacing />
                  <Grid container justify='space-between'>
                    <Grid item>
                      <InputFieldLabel label='* Full Time' />
                      <TextField
                        variant='filled'
                        fullWidth
                        type='number'
                        value={getIndividualValue(option.value, 'vacancyFullTime')}
                        onChange={(e) =>
                          setValue(option, {
                            ...value[option.value],
                            vacancyFullTime: sanitizeValue(e.target.value),
                          })
                        }
                        disabled={disabled}
                        {...props}
                      />
                      {error && <InputFieldError error={error[option.value]?.vacancyFullTime} />}
                    </Grid>
                    <Grid item>
                      <InputFieldLabel label='* Part Time' />
                      <TextField
                        variant='filled'
                        fullWidth
                        type='number'
                        value={getIndividualValue(option.value, 'vacancyPartTime')}
                        onChange={(e) =>
                          setValue(option, {
                            ...value[option.value],
                            vacancyPartTime: sanitizeValue(e.target.value),
                          })
                        }
                        disabled={disabled}
                        {...props}
                      />
                      {error && <InputFieldError error={error[option.value]?.vacancyPartTime} />}
                    </Grid>
                    <Grid item>
                      <InputFieldLabel label='* Casual' />
                      <TextField
                        variant='filled'
                        fullWidth
                        type='number'
                        value={getIndividualValue(option.value, 'vacancyCasual')}
                        onChange={(e) =>
                          setValue(option, {
                            ...value[option.value],
                            vacancyCasual: sanitizeValue(e.target.value),
                          })
                        }
                        disabled={disabled}
                        {...props}
                      />
                      {error && <InputFieldError error={error[option.value]?.vacancyCasual} />}
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
