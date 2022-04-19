import * as yup from 'yup';
import { errorMessage } from '../functions';

export const cohortHasRoom = () => {
  let temp = yup.ref('availableSize');
  console.log(temp);
  return temp > 0;
  // return yup.Ref('.availableSize') > 0; //s
};

export const ParticipantAssignCohortSchema = yup
  .object()
  .noUnknown('Unknown field in form')
  .shape({
    cohort: yup
      .number()
      .required(errorMessage)
      .test('cohort-has-room', 'No available seats in cohort', cohortHasRoom),
    institute: yup.number().required(errorMessage),
    availableSize: yup.number().required(),
  });
