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
    .required(errorMessage)
    .typeError(errorMessage)
    .test('is-reasonable', errorDateIsReasonable, validateDateIsReasonable),
});
