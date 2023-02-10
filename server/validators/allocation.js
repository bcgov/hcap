const yup = require('yup');
const { validateBlankOrPositiveInteger } = require('./helpers');

const CreateAllocationSchema = yup
  .object()
  .noUnknown('Unknown field in entry')
  .shape({
    allocation: yup
      .number()
      .nullable()
      .test(
        'validate-blank-or-number',
        'Must be a positive number',
        validateBlankOrPositiveInteger
      ),
  });

module.exports = { CreateAllocationSchema };
