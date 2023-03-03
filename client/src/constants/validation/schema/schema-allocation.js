import * as yup from 'yup';
import { validateBlankOrPositiveInteger } from '../functions';

export const CreateAllocationSchema = yup.object().shape({
  allocation: yup
    .number()
    .nullable()
    .lessThan(100000, 'Must be less than 100,000')
    .required('Allocation is required')
    .test('validate-blank-or-number', 'Must be a positive number', validateBlankOrPositiveInteger),
});

export const BulkAllocationSchema = yup.object().shape({
  allocation: yup
    .number()
    .lessThan(100000, 'Must be less than 100,000')
    .required('Allocation is required')
    .test('validate-blank-or-number', 'Must be a positive number', validateBlankOrPositiveInteger),
  phase_id: yup.number().required('Phase is required'),
  existingAllocations: yup
    .array()
    .of(
      yup.object({
        allocation: yup.number().required(),
        site_id: yup.number().required(),
        phase_id: yup.number(),
        id: yup.number().required(),
      })
    )
    .nullable(),
  acknowledgement: yup.boolean().when('existingAllocations', {
    is: (val) => val.length > 0,
    then: (boolSchema) =>
      boolSchema.test('is-true', 'Must acknowledge allocation override', (v) => v === true),
    otherwise: (schema) => schema.nullable(),
  }),
});
