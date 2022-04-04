import * as yup from 'yup';
import { validateDateIsReasonable, errorMessage } from '../functions';

export const NewCohortSchema = yup.object().shape({
  cohortName: yup.string().required(errorMessage),
  startDate: yup
    .date()
    .required(errorMessage)
    .test('is-reasonable', 'Invalid year, must be between 1900 and 2100', validateDateIsReasonable)
    .typeError('Start Date is required'),
  endDate: yup
    .date()
    .required(errorMessage)
    .notOneOf([''], 'End Date is required')
    .test('is-reasonable', 'Invalid year, must be between 1900 and 2100', validateDateIsReasonable)
    .when('startDate', (startDate, schema) => {
      return schema.test({
        test: (endDate) => !!startDate && startDate < endDate,
        message: 'End Date must be after Start Date',
      });
    })
    .typeError('End Date is required'),
  cohortSize: yup
    .number()
    .min(1, 'Cohort size must be greater than or equal to 1')
    .required('Cohort size is required'),
});
