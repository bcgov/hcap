import * as yup from 'yup';
import { validateBlankOrPositiveInteger } from './helpers';

export const CreateAllocationSchema = yup
  .object()
  .noUnknown('Unknown field in entry')
  .shape({
    allocation: yup
      .number()
      .nullable()
      .lessThan(100000, 'Must be less than 100,000')
      .test(
        'validate-blank-or-number',
        'Must be a positive number',
        validateBlankOrPositiveInteger
      ),
    phase_id: yup.number().required('Allocation must be related to a phase'),
    site_id: yup.number().required('Allocation must be related to a site'),
  });

export const UpdateAllocationSchema = yup
  .object()
  .noUnknown('Unknown field in entry')
  .shape({
    allocation: yup
      .number()
      .nullable()
      .lessThan(100000, 'Must be less than 100,000')
      .test(
        'validate-blank-or-number',
        'Must be a positive number',
        validateBlankOrPositiveInteger
      ),
  });
