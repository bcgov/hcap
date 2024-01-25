import * as yup from 'yup';
import { validateDateString, validatePastDateString } from '../functions';

export const ExternalHiredParticipantSchema = yup
  .object()
  .noUnknown('Unknown field in form')
  .shape({
    firstName: yup.string().required('First Name is required'),
    lastName: yup.string().required('Last Name is required'),
    phoneNumber: yup
      .string()
      .required('Phone number is required')
      .matches(/^[0-9]{10}$/, 'Phone number must be provided as 10 digits'),
    emailAddress: yup.string().required('Email address is required').email('Invalid email address'),
    origin: yup
      .string()
      .required('Must indicate origin of offer')
      .oneOf(['internal', 'other'], 'Invalid entry'),
    otherOrigin: yup.string().when('origin', {
      is: 'other',
      then: yup.string().required('Please specify'),
      otherwise: yup
        .string()
        .nullable()
        .test('is-null', 'Other origin must be null', (v) => v == null || v === ''),
    }),
    hcapOpportunity: yup.boolean().test('is-true', 'Must be HCAP opportunity', (v) => v === true),
    program: yup.string().required('Requires pathway').oneOf(['HCA', 'MHAW']),
    contactedDate: yup
      .string()
      .required('Date of contact is required')
      .test('is-date', 'Not a valid date in the past', validatePastDateString),
    hiredDate: yup
      .string()
      .required('Date offer accepted  is required')
      .test('is-date', 'Not a valid date in the past', validatePastDateString),
    startDate: yup
      .string()
      .required('Start date is required')
      .test('is-date', 'Not a valid date', validateDateString),
    site: yup.number().required('Site is required'),
    acknowledge: yup
      .boolean()
      .test('is-true', 'Must acknowledge participant acceptance', (v) => v === true),
  });
