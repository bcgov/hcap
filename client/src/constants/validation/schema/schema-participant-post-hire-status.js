import * as yup from 'yup';
import { validateDateString } from '../functions';
import { postHireStatuses, postHireStatusesValues } from '../../../constants/postHireConstants';

export const ParticipantPostHireStatusSchema = yup
  .object()
  .noUnknown('Unknown field in form')
  .shape({
    status: yup
      .string()
      .required('Graduation status is required')
      .oneOf(postHireStatusesValues, 'Invalid status'),
    data: yup.object().when(['status'], (status, schema) => {
      switch (status) {
        case postHireStatuses.postSecondaryEducationCompleted:
        case postHireStatuses.cohortUnsuccessful:
          return schema.noUnknown('Unknown field in data form').shape({
            date: yup
              .string()
              .required('Date is required')
              .test('is-date', 'Invalid date', validateDateString),
          });
        default:
          return schema.test(
            'is-null-or-empty',
            `${status} does not require a data object`,
            (obj) => {
              // Since graduation date is a tracked field for the form, I needed to
              return !obj || Object.keys(obj).length === 0 || !obj.date;
            }
          );
      }
    }),
    continue: yup.string().oneOf(['continue_yes', 'continue_no']).required(''),
  });
