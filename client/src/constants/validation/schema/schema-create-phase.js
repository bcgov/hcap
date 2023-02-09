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
    // .when('startDate', (startDate, schema) => {
    //   if (startDate) {
    //     const nextDay = new Date(startDate.getTime() + 86400000);
    //     return schema.min(
    //       nextDay,
    //       'Invalid entry. End date must be at least 1 day after Start date'
    //     );
    //   } else {
    //     return schema;
    //   }
    // })
    .required(errorMessage)
    .typeError(errorMessage)
    .test('is-reasonable', errorDateIsReasonable, validateDateIsReasonable),
});
