import * as yup from 'yup';
import { validateDateIsInThePast, validateDateIsReasonable } from '../functions';
import { archiveReasonOptions, archiveStatusOptions } from '../../archiveParticipantsConstants';

export const ArchiveHiredParticipantSchema = yup.object().shape({
  type: yup
    .string()
    .oneOf(['duplicate', 'employmentEnded'], 'Please select a type')
    .required('Please select a type'),
  reason: yup.string().when('type', {
    is: 'employmentEnded',
    then: yup.string().required('Please include a reason').oneOf(archiveReasonOptions),
  }),
  status: yup.string().when('type', {
    is: 'employmentEnded',
    then: yup.string().required('Please include a status').oneOf(archiveStatusOptions),
  }),
  endDate: yup.date().when('type', {
    is: 'employmentEnded',
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
    is: 'employmentEnded',
    then: yup
      .string()
      .oneOf(['Yes', 'No'], 'Must be either Yes or No.')
      .required("Must be either 'Yes' or 'No'."),
  }),
  confirmed: yup.boolean().test('is-true', 'Please confirm', (v) => v === true),
});
