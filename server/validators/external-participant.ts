import * as yup from 'yup';
import { validatePastDateString, validateDateString, errorMessage } from './helpers';
import { Program, foundOutReasons } from '../constants';

export const ExternalHiredParticipantSchema = yup.object().shape({
  eligibility: yup
    .string()
    .required(
      "We're sorry, but current eligibility to work in Canada is a requirement to submit this form."
    ),
  educationalRequirements: yup.string().required('Educational requirements is required'),
  firstName: yup.string().required('First Name is required'),
  lastName: yup.string().required('Last Name is required'),
  phoneNumber: yup
    .string()
    .required(errorMessage)
    .matches(/^\d{10}$/, 'Phone number must be provided as 10 digits'),
  emailAddress: yup.string().required(errorMessage).email('Invalid email address'),
  postalCode: yup
    .string()
    .required('Postal code is required')
    .matches(/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/, 'Format as A1A 1A1'),
  driverLicense: yup.string().required('This question is required'),
  indigenous: yup.string(),
  experienceWithMentalHealthOrSubstanceUse: yup.string().when(['program'], {
    is: (program) => program === Program.MHAW,
    then: () => yup.string(),
  }),
  preferredLocation: yup
    .string()
    .required(`Please select at least one location they'd like to work in`),
  reasonForFindingOut: yup
    .array()
    .required('Please let us know how they found out about HCAP')
    .of(yup.string().oneOf(foundOutReasons, 'Invalid selection')),
  currentOrMostRecentIndustry: yup.string(),
  otherIndustry: yup.string().when(['currentOrMostRecentIndustry'], {
    is: (industry) => industry === 'Other, please specify:',
    then: () => yup.string().required('Please specify your industry'),
  }),
  roleInvolvesMentalHealthOrSubstanceUse: yup
    .string()
    .when(['program', 'currentOrMostRecentIndustry'], {
      is: (program, currentOrMostRecentIndustry) =>
        program === Program.MHAW &&
        (currentOrMostRecentIndustry === 'Health care and social assistance' ||
          currentOrMostRecentIndustry === 'Continuing Care and Community Health Care' ||
          currentOrMostRecentIndustry === 'Community Social Services'),
      then: () => yup.string().oneOf(['Yes', 'No']),
    }),
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
