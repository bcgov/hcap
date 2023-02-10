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
    phase_id: yup.number().required('Allocation must be related to a phase'),
    site_id: yup.number().required('Allocation must be related to a site'),
  });

module.exports = { CreateAllocationSchema };
