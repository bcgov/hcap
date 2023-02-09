import * as yup from 'yup';
import { validateDateIsReasonable, errorMessage, errorDateIsReasonable } from '../functions';

export const CreatePhaseSchema = yup.object().shape({
  phaseName: yup.string().required('Phase name is required').max(255, 'Phase name is too long'),
  startDate: yup
    .date()
    .required(errorMessage)
    .typeError(errorMessage)
    .test('is-reasonable', errorDateIsReasonable, validateDateIsReasonable),
  endDate: yup
    .date()
    .when('startDate', (startDate, schema) => {
      if (startDate) {
        return schema.test({
          test: endDate => 
            new Date(new Date(startDate).getTime() + 86400000) <= new Date(endDate),
          message: 'Invalid entry. End date must be at least 1 day after Start date'
        });
      }
    })
    .required(errorMessage)
    .typeError(errorMessage)
    .test('is-reasonable', errorDateIsReasonable, validateDateIsReasonable),
});
