import * as yup from 'yup';
import { validateDateIsReasonable } from '../functions';

export const CreatePhaseSchema = yup.object().shape({
  phaseName: yup.string().required('Phase name is required'),
  startDate: yup
    .date()
    .required('Start date is required')
    .test(
      'is-reasonable',
      'Invalid entry. Date must be after December 31st 1899 and before January 1st 2100.',
      validateDateIsReasonable
    ),
  endDate: yup
    .date()
    .required('End date is required')
    .test(
      'is-reasonable',
      'Invalid entry. Date must be after December 31st 1899 and before January 1st 2100.',
      validateDateIsReasonable
    ),
});
