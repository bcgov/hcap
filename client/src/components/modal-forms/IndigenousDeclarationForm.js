import React from 'react';
import { Button, InputFieldError } from '../generic';
import { Box, Checkbox, FormControl, FormControlLabel, Grid, Typography } from '@material-ui/core';
import { RenderRadioGroup } from '../fields';
import { Field, Formik, Form as FormikForm, ErrorMessage } from 'formik';
import { IndigenousDeclarationSchema } from '../../constants';

export const indigenousIdentityOptions = {
  FIRST_NATIONS: 'first-nations',
  INUIT: 'inuit',
  METIS: 'metis',
  OTHER: 'other',
  UNKNOWN: 'unknown',
};

export const IndigenousDeclarationForm = ({ handleSubmit }) => {
  const initialValues = {
    isIndigenous: null,
    [indigenousIdentityOptions.FIRST_NATIONS]: false,
    [indigenousIdentityOptions.INUIT]: false,
    [indigenousIdentityOptions.METIS]: false,
    [indigenousIdentityOptions.OTHER]: false,
    [indigenousIdentityOptions.UNKNOWN]: false,
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={IndigenousDeclarationSchema}
      onSubmit={handleSubmit}
    >
      {({ values, errors }) => (
        <FormikForm>
          <Box display='flex' flexDirection='column' padding={2} maxWidth={'500px'}>
            <Box marginBottom={2}>
              <Typography variant='h4' component='h1'>
                Complete your Participant Expression of Interest
              </Typography>
            </Box>

            <Typography variant='h5' component='p'>
              Please answer the following question to complete your Participant Expression of
              Interest
            </Typography>

            <Box margin={3} marginBottom={0}>
              <Box marginBottom={2}>
                <FormControl component='fieldset'>
                  <FormControl component='legend'>
                    <Typography variant='subtitle2'>
                      Do you identify as an Indigenous Person?
                    </Typography>
                  </FormControl>

                  <Field
                    id='isIndigenous'
                    name='isIndigenous'
                    component={RenderRadioGroup}
                    row
                    options={[
                      { value: true, label: 'Yes' },
                      { value: false, label: 'No' },
                    ]}
                  />
                </FormControl>
              </Box>

              {values.isIndigenous ? (
                <Box
                  padding={2}
                  marginBottom={2}
                  style={{
                    backgroundColor: 'rgb(243, 244, 246)',
                  }}
                >
                  <FormControl component='fieldset'>
                    <FormControl component='legend'>
                      <Typography variant='subtitle2'>What is your Indigenous Identity?</Typography>
                      <Typography>Choose all that apply</Typography>
                    </FormControl>
                    {[
                      { label: 'First Nations', value: indigenousIdentityOptions.FIRST_NATIONS },
                      { label: 'Inuit', value: indigenousIdentityOptions.INUIT },
                      { label: 'Métis', value: indigenousIdentityOptions.METIS },
                      { label: 'Other', value: indigenousIdentityOptions.OTHER },
                      { label: 'Unknown', value: indigenousIdentityOptions.UNKNOWN },
                    ].map((item) => (
                      // Not useing RenderCheckbox because I don't want it's errors here
                      <Field name={item.value} key={item.value}>
                        {({ field }) => (
                          <FormControlLabel
                            label={item.label}
                            labelPlacement='end'
                            control={
                              <Checkbox
                                sx={{ '& .MuiSvgIcon-root': { fontSize: 28 } }}
                                size='small'
                                color='primary'
                                checked={field.value === true}
                              />
                            }
                            {...field}
                          />
                        )}
                      </Field>
                    ))}
                  </FormControl>

                  {/* If an error exists for any, show one of them. Their errors are tightly coupled */}
                  {(errors[indigenousIdentityOptions.FIRST_NATIONS] ||
                    errors[indigenousIdentityOptions.INUIT] ||
                    errors[indigenousIdentityOptions.METIS] ||
                    errors[indigenousIdentityOptions.OTHER] ||
                    errors[indigenousIdentityOptions.UNKNOWN]) && (
                    <InputFieldError
                      error={<ErrorMessage name={indigenousIdentityOptions.FIRST_NATIONS} />}
                    />
                  )}
                </Box>
              ) : null}
            </Box>

            <Grid container justify='flex-end'>
              <Button type='submit' color='primary' text='Submit' fullWidth={false} />
            </Grid>
          </Box>
        </FormikForm>
      )}
    </Formik>
  );
};
