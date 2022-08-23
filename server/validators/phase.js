const yup = require('yup');
const { validateDateString } = require('./helpers');

const CreatePhaseSchema = yup
  .object()
  .noUnknown('Unknown field in entry')
  .shape({
    name: yup.string().required('Phase name is required'),
    start_date: yup
      .string()
      .required('Start date is required')
      .test('is-date', 'Not a valid date', validateDateString),
    end_date: yup
      .string()
      .required('End date is required')
      .test('is-date', 'Not a valid date', validateDateString),
  });

module.exports = { CreatePhaseSchema };
