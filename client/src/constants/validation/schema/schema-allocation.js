import * as yup from 'yup';
import { validateBlankOrPositiveInteger } from '../functions';

export const CreateAllocationSchema = yup.object().shape({
  allocation: yup
    .number()
    .nullable()
    .required('Allocation is required')
    .test('validate-blank-or-number', 'Must be a positive number', validateBlankOrPositiveInteger),
});
