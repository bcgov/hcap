import * as yup from 'yup';
import { errorMessage } from '../functions';

export const ParticipantAssignCohortSchema = yup
  .object()
  .noUnknown('Unknown field in form')
  .shape({
    cohort: yup.number().required(errorMessage),
    institute: yup.number().required(errorMessage),
  });
