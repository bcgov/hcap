import {
  archiveReasonOptions,
  healthRegions,
  userRoles,
  archiveStatusOptions,
  ROSUnderwayStatus,
  ROSCompleteStatus,
  SuccessfulROSReason,
} from '../constants';

import { validatePastDateString } from './helpers';

const yup = require('yup');

export const ArchiveRequestDataShape = (schema) =>
  schema.noUnknown('').shape({
    type: yup
      .string()
      .oneOf(['duplicate', 'employmentEnded', 'rosComplete'], 'Please select a type')
      .required('Please select a type'),
    reason: yup.string().when(
      'type',
      {
        is: 'employmentEnded',
        then: yup.string().required('Please include a reason').oneOf(archiveReasonOptions),
      },
      {
        is: 'rosComplete',
        then: yup.string().required('Please include a reason').oneOf([SuccessfulROSReason]),
      }
    ),
    status: yup.string().when(
      'type',
      {
        is: 'employmentEnded',
        then: yup
          .string()
          .required('Please include a status')
          .oneOf([ROSUnderwayStatus, ...archiveStatusOptions]),
      },
      {
        is: 'rosComplete',
        then: yup.string().required('Please include a status').oneOf([ROSCompleteStatus]),
      }
    ),
    rehire: yup.string().when('type', {
      is: (type) => ['employmentEnded', 'rosComplete'].includes(type),
      then: yup
        .string()
        .required('Intent to rehire must not be empty')
        .oneOf(['Yes', 'No'], 'Must be either Yes or No.'),
    }),
    endDate: yup.string().when('type', {
      is: 'employmentEnded',
      then: yup
        .string()
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
    data: yup.object().when(['status'], (status, schema) => {
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
      is: 'ministry_of_health',
      then: yup.array().defined(),
      otherwise: yup.array().required('Employer sites are required'),
    }),
    regions: yup.array().when('role', {
      is: 'ministry_of_health',
      then: yup.array().defined(),
      otherwise: yup
        .array()
        .required('Health regions are required')
        .of(yup.string().oneOf(healthRegions, 'Invalid region'))
        .min(1, 'At least 1 health region is required'),
    }),

    role: yup.string().required('Role is required').oneOf(userRoles, 'Invalid role'),
    acknowledgement: yup.boolean().when('role', {
      is: 'ministry_of_health',
      then: yup
        .boolean()
        .test('is-true', 'Must acknowledge admission of MoH user', (v) => v === true),
      otherwise: yup
        .boolean()
        .test('is-bool-opt', 'acknowlegement must be boolean', (v) => v === false),
    }),
  });

export const RemoveParticipantUser = yup.object().shape({
  email: yup.string().email('Invalid email address'),
});
