import React, { useState } from 'react';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import { Formik, Form as FormikForm } from 'formik';
import { useHistory } from 'react-router-dom';

import { ParticipantFormSchema, ParticipantEditFormSchema, Routes } from '../../constants';
import { useToast } from '../../hooks';
import { getErrorMessage, scrollUp } from '../../utils';

import { Button } from '../generic';
import { Summary } from './Summary';
import { Fields } from './Fields';
import { isNonPortalHire } from '../../utils/isNonPortalHire';
import { axiosInstance } from '../../services/api';

export const Form = ({
  initialValues,
  isDisabled,
  hideSummary,
  onSubmit,
  enableFields,
  editMode,
  isSubmitted,
}) => {
  const history = useHistory();
  const { openToast } = useToast();
  const [submitLoading, setSubmitLoading] = useState(false);

  const formValues = initialValues
    ? initialValues
    : {
        eligibility: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        emailAddress: '',
        postalCode: '',
        preferredLocation: [],
        consent: '',
        reasonForFindingOut: [],
      };

  const handleSubmit = async (values) => {
    if (onSubmit) {
      onSubmit(values);
      return;
    }
    setSubmitLoading(true);

    try {
      const { id } = await axiosInstance.post('/participants', values);

      history.push(Routes.ParticipantConfirmation, { formValues: values, id });
    } catch (e) {
      openToast(getErrorMessage(e));
    }
    setSubmitLoading(false);
  };

  const handleSubmitButton = (submitForm) => {
    scrollUp();
    submitForm();
  };

  return (
    <Grid item xs={12}>
      <Formik
        initialValues={formValues}
        validationSchema={editMode ? ParticipantEditFormSchema : ParticipantFormSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, submitForm, setTouched, values }) => (
          <FormikForm>
            <Box hidden={hideSummary} pt={4} pb={4} pl={2} pr={2}>
              <Summary />
            </Box>

            <Box pt={2} pb={4} pl={2} pr={2}>
              <Fields
                values={values}
                isDisabled={isDisabled}
                hideHelp={hideSummary}
                enableFields={enableFields}
                isNonPortalHire={isNonPortalHire(initialValues)}
                isSubmitted={isSubmitted}
              />
            </Box>

            {!isDisabled && (
              <Box display='flex' justifyContent='center' pt={0} pb={4} pl={2} pr={2}>
                <Button
                  onClick={() => handleSubmitButton(submitForm)}
                  variant='contained'
                  color='primary'
                  fullWidth={false}
                  loading={submitLoading}
                  text='Submit'
                />
              </Box>
            )}
          </FormikForm>
        )}
      </Formik>
    </Grid>
  );
};
