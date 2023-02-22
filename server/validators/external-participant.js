import * as yup from 'yup';
import { validatePastDateString, validateDateString, errorMessage } from './helpers';

export const ExternalHiredParticipantSchema = yup.object().shape({
  firstName: yup.string().required('First Name is required'),
  lastName: yup.string().required('Last Name is required'),
  phoneNumber: yup
    .string()
    .required(errorMessage)
    .matches(/^[0-9]{10}$/, 'Phone number must be provided as 10 digits'),
  emailAddress: yup.string().required(errorMessage).email('Invalid email address'),
  origin: yup
    .string()
    .required('Must indicate origin of offer')
    .oneOf(['internal', 'other'], 'Invalid entry'),
  otherOrigin: yup.string().when('origin', {
    is: 'other',
    then: (stringSchema) => stringSchema.required('Please specify'),
    otherwise: (stringSchema) =>
      stringSchema
        .nullable()
        .test('is-null', 'Other origin must be null', (v) => v == null || v === ''),
  }),
  hcapOpportunity: yup.boolean().test('is-true', 'Must be HCAP opportunity', (v) => v === true),
  contactedDate: yup
    .string()
    .required('Date of contact is required')
    .test('is-date', 'Not a valid date in the past', validatePastDateString),
  hiredDate: yup
    .string()
    .required('Date hired is required')
    .test('is-date', 'Not a valid date', validateDateString),
  startDate: yup
    .string()
    .required('Start date is required')
    .test('is-date', 'Not a valid date', validateDateString),
  site: yup.number().required('Site is required'),
  acknowledge: yup
    .boolean()
    .test('is-true', 'Must acknowledge participant acceptance', (v) => v === true),
});
