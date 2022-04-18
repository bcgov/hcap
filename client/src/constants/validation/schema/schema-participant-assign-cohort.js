import * as yup from 'yup';
import { errorMessage } from '../functions';

export const ParticipantAssignCohortSchema = yup
  .object()
  .noUnknown('Unknown field in form')
  .shape({
    cohort: yup
      .number()
      .min(223, 'this should show up as an error')
      .required(errorMessage)
      .test('cohort-has-room', 'No available seats in cohort', cohortHasRoom),
    institute: yup.number().required(errorMessage),
    availableSize: yup.number(),
  });

export const cohortHasRoom = () => {
  return yup.Ref('availableSize') > 0;
};
