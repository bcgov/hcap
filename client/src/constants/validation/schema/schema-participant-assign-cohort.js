import * as yup from 'yup';
import { errorMessage } from '../functions';

export const ParticipantAssignCohortSchema = yup
  .object()
  .noUnknown('Unknown field in form')
  .shape({
    cohort: yup
      .number()
      .required(errorMessage)
      .when(['availableSize'], (size, schema) => {
        return schema.test('cohort-has-room', 'Cohort is full', () => size > 0);
      }),
    institute: yup.number().required(errorMessage),
    availableSize: yup.number().required(),
  });
