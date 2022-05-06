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
  ROSCompleteStatus,
} from '../../constants';
import { getTodayDate } from '../../utils';
import { fetchParticipantReturnOfServiceStatus } from '../../services';

/**
 * Returns form values dependent on the rosStatus of the participant
 * @param {number} participantId
 * @returns { typeOptions, endDate }
 */
const fetchFormOptionData = async (participantId) => {
  const rosStatus = await fetchParticipantReturnOfServiceStatus({ id: participantId });

  const typeOptions = rosStatus
    ? [ROSCompletedType, ...archiveTypeOptions]
    : [...archiveTypeOptions];

  const endDate = rosStatus
    ? dayjs(rosStatus.data.date).add(1, 'years').format('YYYY/MM/DD')
    : dayjs().subtract(1, 'days').format('YYYY/MM/DD');

  return { typeOptions, endDate };
};

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

export const ArchiveHiredParticipantForm = ({ onSubmit, onClose, participantId }) => {
  const [typeOptions, setTypeOptions] = useState([]);
  const [endDate, setEndDate] = useState([]);

  useEffect(() => {
    fetchFormOptionData(participantId).then(({ typeOptions, endDate }) => {
      setTypeOptions(typeOptions);
      setEndDate(endDate);
    });
  }, [setTypeOptions, setEndDate, participantId]);

  const getStatusOptions = (selectedReason) => {
    if (typeOptions.includes(ROSCompletedType)) {
      return selectedReason === ROSReason
        ? formatOptions([ROSCompleteStatus])
        : formatOptions([ROSUnderwayStatus]);
    } else {
      return selectedReason === UnsuccessfulCohortReason
        ? formatOptions([PSIEducationUnderwayStatus])
        : archiveStatusOptions;
    }
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

                if (newValue === 'rosComplete') {
                  setFieldValue('reason', ROSReason);
                  setFieldValue('status', ROSCompleteStatus);
                  setFieldValue('endDate', endDate);
                } else if (newValue === 'employmentEnded') {
                  setFieldValue('reason', '');
                  setFieldValue('status', ROSUnderwayStatus);
                  setFieldValue('endDate', dayjs().subtract(1, 'days').format('YYYY/MM/DD'));
                }
              }}
            />
            {['employmentEnded', 'rosComplete'].includes(values.type) && (
              <>
                <Field
                  name='endDate'
                  component={RenderDateField}
                  maxDate={values.type === 'rosComplete' ? null : getTodayDate()}
                  disabled={values.type === 'rosComplete'}
                  label='End Date'
                />
                <Field
                  name='reason'
                  component={RenderSelectField}
                  options={
                    values.type === 'rosComplete' ? formatOptions([ROSReason]) : reasonOptions
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
