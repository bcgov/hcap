import * as yup from 'yup';
import { validateBlankOrPositiveInteger } from '../functions';

export const CreatePhaseAllocationSchema = yup.object().shape({
  allocation: yup
    .number()
    .nullable()
    .test('validate-blank-or-number', 'Must be a positive number', validateBlankOrPositiveInteger),
});
