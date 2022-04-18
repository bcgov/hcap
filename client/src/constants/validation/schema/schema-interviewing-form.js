import * as yup from 'yup';
import { validatePastDateString } from '../functions';

export const InterviewingFormSchema = yup
  .object()
  .noUnknown('Unknown field in form')
  .shape({
    contactedDate: yup
      .string()
      .required('Date of contact is required')
      .test('is-date', 'Invalid entry. Date must be in the past.', validatePastDateString),
  });
