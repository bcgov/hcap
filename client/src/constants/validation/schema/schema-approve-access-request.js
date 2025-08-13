import * as yup from 'yup';
import { healthRegions } from '../constants';
import { Role, UserRoles } from '../../user-roles';

export const ApproveAccessRequestSchema = yup
  .object()
  .noUnknown()
  .shape({
    role: yup.string().required('Role is required').oneOf(UserRoles, 'Invalid role'),
    sites: yup.array().when('role', ([role], schema) => {
      return role === Role.MinistryOfHealth
        ? schema.nullable()
        : schema
            .required('Employer sites are required')
            .min(1, 'At least 1 employer site is required');
    }),
    regions: yup.array().when('role', ([role], schema) => {
      return role === Role.MinistryOfHealth
        ? schema.nullable()
        : schema
            .required('Health regions are required')
            .of(yup.string().oneOf(healthRegions, 'Invalid region'))
            .min(1, 'At least 1 health region is required');
    }),
    acknowledgement: yup.boolean().when('role', ([role], schema) => {
      return role === Role.MinistryOfHealth
        ? schema.test('is-true', 'Must acknowledge user access', (v) => v === true)
        : schema;
    }),
  });
