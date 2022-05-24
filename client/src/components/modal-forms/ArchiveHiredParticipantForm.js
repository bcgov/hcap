import React from 'react';
import { Box } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import dayjs from 'dayjs';
import { addYearToDate } from '../../utils';
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
  EmploymentEndedType,
  ROSCompletedType,
  SuccessfulROSReason,
  ROSUnderwayStatus,
  ROSCompleteStatus,
} from '../../constants';
import { getTodayDate } from '../../utils';

/**
 * Formats for RenderSelectField
 * @param {[string]} optionList
 * @returns {[{value: string, label: string},...]}
 */
const formatOptions = (optionList) => {
  return optionList.map((option) => ({ value: option, label: option }));
};

const reasonOptions = formatOptions(archiveReasonOptions);

const archiveHiredParticipantInitialValues = {
  type: '',
  reason: '',
  status: '',
  rehire: '',
  endDate: dayjs().subtract(1, 'days').format('YYYY/MM/DD'),
  confirmed: false,
};

export const ArchiveHiredParticipantForm = ({ onSubmit, onClose, participant }) => {
  if (!participant) {
    return null;
  }
  const isROSStarted = participant.rosStatuses && participant.rosStatuses.length > 0 ? true : false;

  const typeOptions = isROSStarted
    ? [ROSCompletedType, ...archiveTypeOptions]
    : [...archiveTypeOptions];

  const endDate = isROSStarted
    ? addYearToDate(participant.rosStatuses[0].data.date).format('YYYY/MM/DD')
    : dayjs().subtract(1, 'days').format('YYYY/MM/DD');

  const getStatusOptions = (selectedReason) => {
    if (isROSStarted) {
      return selectedReason === SuccessfulROSReason
        ? formatOptions([ROSCompleteStatus])
        : formatOptions([ROSUnderwayStatus]);
    }
    return selectedReason === UnsuccessfulCohortReason
      ? formatOptions([PSIEducationUnderwayStatus])
      : formatOptions(archiveStatusOptions);
  };

  return (
    <Formik
      initialValues={archiveHiredParticipantInitialValues}
      validationSchema={ArchiveHiredParticipantSchema}
      onSubmit={onSubmit}
    >
      {({ values, setFieldValue, submitForm }) => {
        return (
          <FormikForm>
            <Field
              name='type'
              component={RenderSelectField}
              options={typeOptions}
              label='Type'
              onChange={(event) => {
                const newValue = event.target.value;
                setFieldValue('type', newValue);

                if (isROSStarted) {
                  if (newValue === ROSCompletedType.value) {
                    setFieldValue('reason', SuccessfulROSReason);
                    setFieldValue('status', ROSCompleteStatus);
                    setFieldValue('endDate', endDate);
                  } else {
                    setFieldValue('reason', '');
                    setFieldValue('status', ROSUnderwayStatus);
                    setFieldValue('endDate', dayjs().subtract(1, 'days').format('YYYY/MM/DD'));
                  }
                }
              }}
            />
            {[EmploymentEndedType.value, ROSCompletedType.value].includes(values.type) && (
              <>
                <Field
                  name='endDate'
                  component={RenderDateField}
                  maxDate={values.type === ROSCompletedType.value ? null : getTodayDate()}
                  disabled={values.type === ROSCompletedType.value}
                  label='End Date'
                />
                <Field
                  name='reason'
                  component={RenderSelectField}
                  options={
                    values.type === ROSCompletedType.value
                      ? formatOptions([SuccessfulROSReason])
                      : reasonOptions
                  }
                  label='Reason'
                />
                <Field
                  name='status'
                  component={RenderSelectField}
                  options={getStatusOptions(values.reason)}
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
                  <Button onClick={submitForm} variant='contained' color='primary' text='Submit' />
                </Grid>
              </Grid>
            </Box>
          </FormikForm>
        );
      }}
    </Formik>
  );
};
