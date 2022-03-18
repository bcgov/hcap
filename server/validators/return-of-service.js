const yup = require('yup');
const { rosPositionTypeValues, rosEmploymentTypeValues } = require('../constants');
const { validISODateString } = require('./helpers');

const CreateReturnOfServiceSchema = yup
  .object()
  .noUnknown('Unknown field in form')
  .shape({
    status: yup.string().optional(),
    data: yup
      .object()
      .required('Data object is required')
      .shape({
        date: yup
          .string()
          .required('Return of service date (data.date) is required')
          .test('is-date', 'Not a valid date', validISODateString),
        positionType: yup
          .string()
          .required('Position Type (data.positionType) is required')
          .oneOf(rosPositionTypeValues),
        employmentType: yup
          .string()
          .optional('Employment Type (data.employmentType) is required')
          .oneOf(rosEmploymentTypeValues),
        sameSite: yup.boolean().required('Same Site flag (data.sameSite) is required'),
      }),
  });

module.exports = {
  CreateReturnOfServiceSchema,
};
