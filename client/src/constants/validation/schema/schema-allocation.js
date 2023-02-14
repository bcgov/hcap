import * as yup from 'yup';
import { validateBlankOrPositiveInteger } from '../functions';

export const CreatePhaseAllocationSchema = yup.object().shape({
  allocation: yup
    .number()
    .nullable()
    .required('Allocation is required')
    .max(99, 'Must be between 0-99')
    .test('validate-blank-or-number', 'Must be a positive number', validateBlankOrPositiveInteger),
});
