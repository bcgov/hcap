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
  phase_id: yup.number().required('Phase is required'),
  allocation: yup
    .number()
    .lessThan(100000, 'Must be less than 100,000')
    .required('Allocation is required')
    .test('validate-blank-or-number', 'Must be a positive number', validateBlankOrPositiveInteger),
});
