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

export const BulkAllocationSchema = yup
  .object()
  .noUnknown('Unknown field in entry')
  .shape({
    acknowledgement: yup
      .boolean()
      .nullable()
      .test('is-true', 'Please confirm', (v) => v === true),
    allocation: yup
      .number()
      .required('Allocations are required')
      .lessThan(100000, 'Must be less than 100,000')
      .test(
        'validate-blank-or-number',
        'Must be a positive number',
        validateBlankOrPositiveInteger
      ),
    phase_id: yup.number().required('Allocations must be related to a phase'),
    siteIds: yup.array().of(yup.number()).required('Allocations must be related to a site'),
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
  });
