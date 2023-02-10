import { validISODateString } from './helpers';
// TODO fix
// eslint-disable-next-line @typescript-eslint/no-var-requires
const yup = require('yup');

export const CreatePhaseSchema = yup
  .object()
  .noUnknown('Unknown field in entry')
  .shape({
    name: yup
      .string()
      .required('Phase name is required')
      .max(255, 'Phase name should be no longer than 255 characters'),
    start_date: yup
      .string()
      .required('Start date is required')
      .test('is-date', 'Not a valid date', validISODateString),
    end_date: yup
      .string()
      .when('start_date', (startDate, schema) => {
        if (startDate) {
          return schema.test(
            'is-after-start',
            'Invalid entry. End date must be at least 1 day after Start date',
            (v) => Date.parse(startDate) + 86400000 <= Date.parse(v)
          );
        }
        return schema;
      })
      .required('End date is required')
      .test('is-date', 'Not a valid date', validISODateString),
  });
