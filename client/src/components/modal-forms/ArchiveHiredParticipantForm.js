import React, { useEffect, useState } from 'react';
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
  ROSCompletedType,
  ROSReason,
  ROSUnderwayStatus,
} from '../../constants';
import { getTodayDate } from '../../utils';
import { fetchParticipantReturnOfServiceStatus } from '../../services';

/**
 *
 * @param {number} participantId
 * @param {FormikProps} formProps
 * @returns ???? options???
 */
const fetchFormOptionData = async (participantId, formProps) => {
  const rosStatus = await fetchParticipantReturnOfServiceStatus({ id: participantId });

  const statuses = [...archiveStatusOptions];
  const reasons = [...archiveReasonOptions];
  const typeOptions = [...archiveTypeOptions];
  if (rosStatus) {
    statuses.unshift(ROSUnderwayStatus);
    reasons.unshift(ROSReason);
    typeOptions.unshift(ROSCompletedType);
  } else if (formProps.reason === UnsuccessfulCohortReason) {
    statuses = PSIEducationUnderwayStatus;
  }

  const statusOptions = statuses.map((option) => ({ value: option, label: option }));
  const reasonOptions = reasons.map((option) => ({ value: option, label: option }));
  return { statusOptions, reasonOptions, typeOptions };
};

const archiveHiredParticipantInitialValues = {
  type: '',
  reason: '',
  status: '',
  rehire: '',
  endDate: dayjs().subtract(1, 'days').format('YYYY/MM/DD'),
  confirmed: false,
};

export const ArchiveHiredParticipantForm = ({ onSubmit, onClose, participantId }) => {
  const [statusOptions, setStatusOptions] = useState([]);
  const [reasonOptions, setReasonOptions] = useState([]);
  const [typeOptions, setTypeOptions] = useState([]);

  useEffect(() => {
    fetchFormOptionData(participantId).then(({ statusOptions, reasonOptions, typeOptions }) => {
      setStatusOptions(statusOptions);
      setReasonOptions(reasonOptions);
      setTypeOptions(typeOptions);
    });
  }, [setStatusOptions, setReasonOptions, setTypeOptions, participantId]);

  return (
    <Formik
      initialValues={archiveHiredParticipantInitialValues}
      validationSchema={ArchiveHiredParticipantSchema}
      onSubmit={onSubmit}
    >
      {(props) => {
        return (
          <FormikForm>
            <Field name='type' component={RenderSelectField} options={typeOptions} label='Type' />
            {['employmentEnded', 'rosComplete'].includes(props.values.type) && (
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
                  options={statusOptions}
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
