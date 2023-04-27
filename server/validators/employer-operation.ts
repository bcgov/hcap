import * as yup from 'yup';
import {
  archiveReasonOptions,
  healthRegions,
  archiveStatusOptions,
  ROSUnderwayStatus,
  ROSCompleteStatus,
  SuccessfulROSReason,
  UserRoles,
  Role,
} from '../constants';

import { validatePastDateString } from './helpers';

export const ArchiveRequestDataShape = (schema) =>
  schema.noUnknown('').shape({
    type: yup
      .string()
      .oneOf(['duplicate', 'employmentEnded', 'rosComplete'], 'Please select a type')
      .required('Please select a type'),
    // See https://github.com/jquense/yup/issues/1901 for why this is needed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reason: yup.string().when('type', (type: any, stringSchema) => {
      if (type === 'rosComplete' || type === 'employmentEnded')
        return stringSchema
          .required('Please include a reason')
          .oneOf(type === 'rosComplete' ? [SuccessfulROSReason] : archiveReasonOptions);
      return stringSchema;
    }),
    status: yup
      .string()
      .when('type', {
        is: 'employmentEnded',
        then: (stringSchema) =>
          stringSchema
            .required('Please include a status')
            .oneOf([ROSUnderwayStatus, ...archiveStatusOptions]),
      })
      .when('type', {
        is: 'rosComplete',
        then: (stringSchema) =>
          stringSchema.required('Please include a status').oneOf([ROSCompleteStatus]),
      }),
    rehire: yup
      .string()
      // See https://github.com/jquense/yup/issues/1901 for why this is needed
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .when('type', (type: any, stringSchema) =>
        ['employmentEnded', 'rosComplete'].includes(type)
          ? stringSchema
              .required('Intent to rehire must not be empty')
              .oneOf(['Yes', 'No'], 'Must be either Yes or No.')
          : stringSchema
      ),
    endDate: yup.string().when('type', {
      is: 'employmentEnded',
      then: (stringSchema) =>
        stringSchema
          .test('is-present', 'Invalid entry. Date must be in the past.', validatePastDateString)
          .required('Please enter the date this participant was removed'),
    }),
    confirmed: yup.boolean().test('is-true', 'Please confirm', (v) => v === true),
  });

export const ArchiveRequest = yup
  .object()
  .noUnknown('Unknown field in form')
  .shape({
    participantId: yup.number().required('Participant ID is required'),
    site: yup.number().required('Must include a site id'),
    data: yup.object().when(['status'], ([status], schema) => {
      if (status !== 'archived') {
        return schema.test(
          'is-null-or-empty',
          `${status} does not require a data object`,
          (obj) => !obj || Object.keys(obj).length === 0
        );
      }
      return ArchiveRequestDataShape(schema);
    }),
    status: yup.string().oneOf(['archived'], 'Must be archived'),
  });

export const AccessRequestApproval = yup
  .object()
  .noUnknown('Unknown field in form')
  .shape({
    userId: yup.string().required('User ID is required'),
    username: yup.string().required('Username is required'),
    sites: yup.array().when('role', {
      is: Role.MinistryOfHealth,
      then: (arraySchema) => arraySchema.defined(),
      otherwise: (arraySchema) => arraySchema.required('Employer sites are required'),
    }),
    regions: yup.array().when('role', {
      is: Role.MinistryOfHealth,
      then: (arraySchema) => arraySchema.defined(),
      otherwise: (arraySchema) =>
        arraySchema
          .required('Health regions are required')
          .of(yup.string().oneOf(healthRegions, 'Invalid region'))
          .min(1, 'At least 1 health region is required'),
    }),

    role: yup.string().required('Role is required').oneOf(UserRoles, 'Invalid role'),
    acknowledgement: yup.boolean().when('role', {
      is: Role.MinistryOfHealth,
      then: (boolSchema) =>
        boolSchema.test('is-true', 'Must acknowledge admission of MoH user', (v) => v === true),
      otherwise: (boolSchema) =>
        boolSchema.test('is-bool-opt', 'acknowlegement must be boolean', (v) => v === false),
    }),
  });

export const RemoveParticipantUser = yup.object().shape({
  email: yup.string().email('Invalid email address'),
});
