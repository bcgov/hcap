import React from 'react';
import { Box } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import dayjs from 'dayjs';
import { Button } from '../generic';
import { Field, Formik, Form as FormikForm } from 'formik';
import { RenderSelectField, RenderDateField, RenderCheckbox, RenderRadioGroup } from '../fields';
import {
  ArchiveHiredParticipantSchema,
  archiveReasonOptions,
  archiveStatusOptions,
  archiveTypeOptions,
  UnsuccessfulCohortReason,
  PSIEducationUnderwayStatus,
} from '../../constants';
import { getTodayDate } from '../../utils';
import { fetchParticipantReturnOfServiceStatus } from '../../services';

/**
 *
 * @param {number} participantId
 * @param {FormikProps} formProps
 * @returns ???? options???
 */
const getStatusOptions = (participantId, formProps) => {
  console.log(formProps);
  fetchParticipantReturnOfServiceStatus({ id: participantId }).then(
    (response) => {
      // is currently false when no ROS status
      console.log(response);
    },
    (rejected) => {
      console.log(rejected);
    }
  );
  let options = archiveStatusOptions;
  if (formProps.reason === UnsuccessfulCohortReason) {
    options = PSIEducationUnderwayStatus;
  }
  return options.map((option) => ({ value: option, label: option }));
};

// const statusOptions = archiveStatusOptions.map((option) => ({ value: option, label: option }));
const reasonOptions = archiveReasonOptions.map((option) => ({ value: option, label: option }));

const archiveHiredParticipantInitialValues = {
  type: '',
  reason: '',
  status: '',
  rehire: '',
  endDate: dayjs().subtract(1, 'days').format('YYYY/MM/DD'),
  confirmed: false,
};

export const ArchiveHiredParticipantForm = ({ onSubmit, onClose, participantId }) => {
  console.log(participantId);
  return (
    <Formik
      initialValues={archiveHiredParticipantInitialValues}
      validationSchema={ArchiveHiredParticipantSchema}
      onSubmit={onSubmit}
    >
      {(props) => {
        return (
          <FormikForm>
            <Field
              name='type'
              component={RenderSelectField}
              options={archiveTypeOptions}
              label='Type'
            />
            {props.values.type === 'employmentEnded' && (
              <>
                <Field
                  name='endDate'
                  component={RenderDateField}
                  maxDate={getTodayDate}
                  label='End Date'
                />
                <Field
                  name='reason'
                  component={RenderSelectField}
                  options={reasonOptions}
                  label='Reason'
                />
                <Field
                  name='status'
                  component={RenderSelectField}
                  options={getStatusOptions(participantId, props.values)}
                  label='Status'
                />
                <Field
                  name='rehire'
                  component={RenderRadioGroup}
                  options={[
                    { value: 'Yes', label: 'Yes' },
                    { value: 'No', label: 'No' },
                  ]}
                  label='I intend to rehire this position'
                />
              </>
            )}
            <Field
              name='confirmed'
              component={RenderCheckbox}
              label='I acknowledge that the information above is correct and that archiving this participant is irreversible.'
            />
            <Box mt={3}>
              <Grid container spacing={2} justify='flex-end'>
                <Grid item>
                  <Button onClick={onClose} color='default' text='Cancel' />
                </Grid>
                <Grid item>
                  <Button
                    onClick={props.submitForm}
                    variant='contained'
                    color='primary'
                    text='Submit'
                  />
                </Grid>
              </Grid>
            </Box>
          </FormikForm>
        );
      }}
    </Formik>
  );
};
