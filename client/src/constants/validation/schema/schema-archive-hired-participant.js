import * as yup from 'yup';
import { validateDateIsInThePast, validateDateIsReasonable } from '../functions';
import {
  archiveReasonOptions,
  archiveStatusOptions,
  SuccessfulROSReason,
  ROSUnderwayStatus,
  ROSCompleteStatus,
  ROSCompletedType,
  EmploymentEndedType,
} from '../../archiveParticipantsConstants';

const typeValidationMap = {
  [ROSCompletedType.value]: { reasons: [SuccessfulROSReason], statuses: [ROSCompleteStatus] },
  [EmploymentEndedType.value]: {
    reasons: archiveReasonOptions,
    statuses: [ROSUnderwayStatus, ...archiveStatusOptions],
  },
};

export const ArchiveHiredParticipantSchema = yup.object().shape({
  type: yup
    .string()
    .oneOf(['duplicate', 'employmentEnded', 'rosComplete'], 'Please select a type')
    .required('Please select a type'),
  reason: yup.string().when(['type'], (type, schema) => {
    return typeValidationMap[type]
      ? schema.required('Please include a reason').oneOf(typeValidationMap[type].reasons)
      : schema.optional().nullable();
  }),
  status: yup.string().when(['type'], (type, schema) => {
    return typeValidationMap[type]
      ? schema.required('Please include a status').oneOf(typeValidationMap[type].statuses)
      : schema.optional().nullable();
  }),
  endDate: yup.date().when('type', {
    is: EmploymentEndedType.value,
    then: yup
      .date()
      .test('is-present', 'Invalid entry. Date must be in the past.', validateDateIsInThePast)
      .test(
        'is-reasonable',
        'Invalid entry. Date must be after December 31st 1899.',
        validateDateIsReasonable
      )
      .typeError('Invalid Date, must be in the format YYYY/MM/DD'),
  }),
  rehire: yup.string().when('type', {
    is: (type) => [EmploymentEndedType.value, ROSCompletedType.value].includes(type),
    then: yup
      .string()
      .oneOf(['Yes', 'No'], 'Must be either Yes or No.')
      .required("Must be either 'Yes' or 'No'."),
  }),
  confirmed: yup.boolean().test('is-true', 'Please confirm', (v) => v === true),
});
