import * as yup from 'yup';
import mapValues from 'lodash/mapValues';
import { archiveReasonOptions, archiveStatusOptions } from './archiveParticipantsConstants';

const healthRegions = ['Interior', 'Fraser', 'Vancouver Coastal', 'Vancouver Island', 'Northern'];

const siteTypes = ['Long-term care', 'Assisted living', 'Both', 'Other'];

const userRoles = ['health_authority', 'employer', 'ministry_of_health'];

const validateDateString = (s) => {
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(s) === false) return false;
  const date = Date.parse(s);
  return typeof date === 'number' && !Number.isNaN(date);
};

const validatePastDateString = (s) => {
  if (!validateDateString(s)) return false;
  return Date.parse(s) <= new Date();
};

const validateUniqueArray = (a) => Array.isArray(a) && new Set(a).size === a.length;

const validateBlankOrPositiveInteger = (n) =>
  n === '' || typeof n === 'undefined' || n === null || (Number.isInteger(n) && n >= 0);

const errorMessage = ({ path }) => {
  const errorMessages = {
    // Common fields
    firstName: 'First name is required',
    lastName: 'Last name is required',
    phoneNumber: 'Phone number is required',
    emailAddress: 'Email address is required',
    postalCode: 'Postal code is required',

    // Employer operator contact info
    registeredBusinessName: 'Business name is required',
    isRHO: 'Regional Health Office status is required',
    operatorName: 'Operator name is required',
    operatorContactFirstName: 'Operator contact first name is required',
    operatorContactLastName: 'Operator contact last name is required',
    operatorEmail: 'Operator email is required',
    operatorPhone: 'Operator phone is required',
    operatorAddress: 'Operator address is required',
    operatorPostalCode: 'Operator postal code is required',

    // Employer site contact info
    siteName: 'Site name is required',
    address: 'Address is required',
    healthAuthority: 'Health authority is required',
    siteContactFirstName: 'First name is required',
    siteContactLastName: 'Last name is required',

    // Employer site type and size info
    siteType: 'Site type is required',
    numPublicLongTermCare: 'Number of publicly funded long-term care beds is required',
    numPrivateLongTermCare: 'Number of privately funded long-term care beds is required',
    numPublicAssistedLiving: 'Number of publicly funded assisted living beds is required',
    numPrivateAssistedLiving: 'Number of privately funded assisted living beds is required',

    // Workforce Baseline
    workforceBaseline: 'All Workforce Baseline fields are required',

    // Employer HCAP request
    hcswFteNumber: 'A number is required',

    // Employer certification
    doesCertify: 'Must certify this',

    // Orbeon ID from the XML file name
    orbeonId: 'Invalid Orbeon ID format.',

    // Participant info
    eligibility:
      "We're sorry, but current eligibility to work in Canada is a requirement to submit this form.",
    preferredLocation: "Please select at least one location you'd like to work in.",
    consent: "We're sorry, but we cannot process your request without permission.",
  };
  return errorMessages[path] || `Failed validation on ${path}`;
};

export const LoginSchema = yup
  .object()
  .noUnknown()
  .shape({
    username: yup.string().required('Username is required'),
    password: yup.string().required('Password is required'),
  });

export const ApproveAccessRequestSchema = yup
  .object()
  .noUnknown()
  .shape({
    role: yup.string().required('Role is required').oneOf(userRoles, 'Invalid role'),
    sites: yup.array().when('role', {
      is: 'ministry_of_health',
      then: yup.array().nullable(),
      otherwise: yup
        .array()
        .required('Employer sites are required')
        .min(1, 'At least 1 employer site is required'),
    }),
    regions: yup.array().when('role', {
      is: 'ministry_of_health',
      then: yup.array().nullable(),
      otherwise: yup
        .array()
        .required('Health regions are required')
        .of(yup.string().oneOf(healthRegions, 'Invalid region'))
        .min(1, 'At least 1 health region is required'),
    }),
    acknowledgement: yup.boolean().when('role', {
      is: 'ministry_of_health',
      then: yup.boolean().test('is-true', 'Must acknowledge user access', (v) => v === true),
      otherwise: yup.boolean(),
    }),
  });

export const EmployerFormSchema = yup
  .object()
  .noUnknown('Unknown field for form')
  .shape({
    // Operator Contact Information
    registeredBusinessName: yup.string().nullable(errorMessage),
    operatorName: yup.string().nullable(errorMessage),
    operatorContactFirstName: yup.string().nullable(errorMessage),
    operatorContactLastName: yup.string().nullable(errorMessage),
    operatorEmail: yup.string().nullable(errorMessage).email('Invalid email address'),
    operatorPhone: yup
      .string()
      .nullable(errorMessage)
      .matches(/^[0-9]{10}$/, 'Phone number must be provided as 10 digits'),
    operatorAddress: yup.string().nullable(errorMessage),
    operatorPostalCode: yup
      .string()
      .nullable(errorMessage)
      .matches(/^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/, 'Format as A1A 1A1'),

    // Site contact info
    siteName: yup.string().nullable(errorMessage),
    address: yup.string().nullable(errorMessage),
    healthAuthority: yup
      .string()
      .nullable(errorMessage)
      .oneOf([...healthRegions, ''], 'Invalid location'),
    siteContactFirstName: yup.string().nullable(errorMessage),
    siteContactLastName: yup.string().nullable(errorMessage),
    phoneNumber: yup
      .string()
      .nullable(errorMessage)
      .matches(/^[0-9]{10}$/, 'Phone number must be provided as 10 digits'),
    emailAddress: yup.string().nullable(errorMessage).email('Invalid email address'),

    // Site type and size info
    siteType: yup
      .string()
      .nullable(errorMessage)
      .oneOf([...siteTypes, ''], 'Invalid site type'),
    otherSite: yup.string().when('siteType', {
      is: 'Other',
      then: yup.string().nullable('Must specify other site type'),
      otherwise: yup
        .string()
        .nullable()
        .test('is-null', 'Other site type must be null', (v) => v == null || v === ''),
    }),
    numPublicLongTermCare: yup
      .number()
      .test(
        'validate-blank-or-number',
        'Must be a positive number',
        validateBlankOrPositiveInteger
      ),
    numPrivateLongTermCare: yup
      .number()
      .test(
        'validate-blank-or-number',
        'Must be a positive number',
        validateBlankOrPositiveInteger
      ),
    numPublicAssistedLiving: yup
      .number()
      .test(
        'validate-blank-or-number',
        'Must be a positive number',
        validateBlankOrPositiveInteger
      ),
    numPrivateAssistedLiving: yup
      .number()
      .test(
        'validate-blank-or-number',
        'Must be a positive number',
        validateBlankOrPositiveInteger
      ),

    // HCAP Request
    hcswFteNumber: yup
      .number()
      .test(
        'validate-blank-or-number',
        'Must be a positive number',
        validateBlankOrPositiveInteger
      ),

    // Workforce Baseline
    workforceBaseline: yup.lazy((obj) =>
      yup.object().shape(
        mapValues(obj, (value, key) => {
          return yup
            .object()
            .noUnknown('Unknown field for workforce baseline')
            .shape({
              currentFullTime: yup
                .number()
                .test(
                  'validate-blank-or-number',
                  'Must be a positive number',
                  validateBlankOrPositiveInteger
                ),
              currentPartTime: yup
                .number()
                .test(
                  'validate-blank-or-number',
                  'Must be a positive number',
                  validateBlankOrPositiveInteger
                ),
              currentCasual: yup
                .number()
                .test(
                  'validate-blank-or-number',
                  'Must be a positive number',
                  validateBlankOrPositiveInteger
                ),
              vacancyFullTime: yup
                .number()
                .test(
                  'validate-blank-or-number',
                  'Must be a positive number',
                  validateBlankOrPositiveInteger
                ),
              vacancyPartTime: yup
                .number()
                .test(
                  'validate-blank-or-number',
                  'Must be a positive number',
                  validateBlankOrPositiveInteger
                ),
              vacancyCasual: yup
                .number()
                .test(
                  'validate-blank-or-number',
                  'Must be a positive number',
                  validateBlankOrPositiveInteger
                ),
            });
        })
      )
    ),

    // Staffing Challenges
    staffingChallenges: yup.string().nullable(),

    // Certification
    doesCertify: yup
      .boolean()
      .typeError(errorMessage)
      .required(errorMessage)
      .test('is-true', errorMessage, (v) => v === true),
  });

export const InterviewingFormSchema = yup
  .object()
  .noUnknown('Unknown field in form')
  .shape({
    contactedDate: yup
      .string()
      .required('Date of contact is required')
      .test('is-date', 'Invalid entry. Date must be in the past.', validatePastDateString),
  });

export const HireFormSchema = yup
  .object()
  .noUnknown('Unknown field in form')
  .shape({
    startDate: yup
      .string()
      .required('Start date is required')
      .test('is-date', 'Not a valid date', validateDateString),
    hiredDate: yup
      .string()
      .required('Date hired is required')
      .test('is-date', 'Not a valid date in the past', validatePastDateString),
    nonHcapOpportunity: yup.boolean().required('Non-Hcap Opportunity is required as true or false'),
    acknowledge: yup
      .boolean()
      .test('is-true', 'Must acknowledge participant acceptance', (v) => v === true),
    positionTitle: yup.string().when('nonHcapOpportunity', {
      is: true,
      then: yup.string().required('Position title is required'),
      otherwise: yup.string().nullable(),
    }),
    positionType: yup.string().when('nonHcapOpportunity', {
      is: true,
      then: yup
        .string()
        .required('Position type is required')
        .oneOf(['Full-Time', 'Part-Time', 'Casual'], 'Invalid position type'),
      otherwise: yup.string().nullable(),
    }),
    site: yup.number().required('Site is required'),
  });

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

export const EditParticipantFormSchema = yup.object().shape({
  firstName: yup.string().required(errorMessage),
  lastName: yup.string().required(errorMessage),
  phoneNumber: yup
    .string()
    .required(errorMessage)
    .matches(/^\d{10}$/, 'Phone number must be provided as 10 digits'),
  postalCode: yup
    .string()
    .required('Postal code is required')
    .test('isnot-null', 'Postal code is required!', (v) => {
      return v !== undefined && v !== '' && v !== null;
    })
    .matches(/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/, 'Invalid postal code'),
  emailAddress: yup.string().required(errorMessage).email('Invalid email address'),
  interested: yup.string().nullable(),
});
export const ArchiveHiredParticipantSchema = yup.object().shape({
  type: yup
    .string()
    .oneOf(['duplicate', 'employmentEnded'], 'Please select a type')
    .required('Please select a type'),
  reason: yup.string().when('type', {
    is: 'employmentEnded',
    then: yup.string().required('Please include a reason').oneOf(archiveReasonOptions),
  }),
  status: yup.string().when('type', {
    is: 'employmentEnded',
    then: yup.string().required('Please include a status').oneOf(archiveStatusOptions),
  }),
  endDate: yup
    .date()
    .required('Please enter the date this participant was removed.')
    .test('is-present', 'Invalid entry. Date must be in the past.', validatePastDateString),
  confirmed: yup.boolean().test('is-true', 'Please confirm', (v) => v === true),
});

export const CreateSiteSchema = yup.object().shape({
  siteId: yup.number().required('Site ID is required'),
  siteName: yup.string().required(errorMessage),
  allocation: yup
    .number()
    .nullable()
    .test('validate-blank-or-number', 'Must be a positive number', validateBlankOrPositiveInteger),
  address: yup.string().nullable(),
  city: yup.string().nullable(),
  isRHO: yup.boolean().nullable().required(errorMessage),
  healthAuthority: yup.string().required(errorMessage).oneOf(healthRegions, 'Invalid region'),
  postalCode: yup
    .string()
    .required(errorMessage)
    .matches(/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/, 'Format as A1A 1A1'),
  registeredBusinessName: yup.string().nullable(),
  operatorName: yup.string().nullable(),
  operatorContactFirstName: yup.string().nullable(),
  operatorContactLastName: yup.string().nullable(),
  operatorEmail: yup.string().nullable().email('Invalid email address'),
  operatorPhone: yup
    .string()
    .nullable()
    .matches(/^([0-9]{10})?$/, 'Phone number must be provided as 10 digits'),
  siteContactFirstName: yup.string().nullable(),
  siteContactLastName: yup.string().nullable(),
  siteContactPhone: yup
    .string()
    .nullable()
    .matches(/^[0-9]{10}$/, 'Phone number must be provided as 10 digits'),
  siteContactEmail: yup.string().nullable().email('Invalid email address'),
});

export const EditSiteSchema = yup.object().shape({
  siteContactFirstName: yup.string().required(errorMessage),
  siteContactLastName: yup.string().required(errorMessage),
  siteContactPhone: yup
    .string()
    .required(errorMessage)
    .matches(/^[0-9]{10}$/, 'Phone number must be provided as 10 digits'),
  siteContactEmail: yup.string().required(errorMessage).email('Invalid email address'),
  siteName: yup.string().required(errorMessage),
  registeredBusinessName: yup.string().required(errorMessage),
  address: yup.string().required(errorMessage),
  city: yup.string().required(errorMessage),
  postalCode: yup
    .string()
    .required(errorMessage)
    .matches(/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/, 'Format as A1A 1A1'),
  allocation: yup
    .number()
    .required('Allocation number is required')
    .test('validate-blank-or-number', 'Must be a positive number', validateBlankOrPositiveInteger),
  operatorContactFirstName: yup.string().required(errorMessage),
  operatorContactLastName: yup.string().required(errorMessage),
  operatorPhone: yup
    .string()
    .required(errorMessage)
    .matches(/^[0-9]{10}$/, 'Phone number must be provided as 10 digits'),
  operatorEmail: yup.string().required(errorMessage).email('Invalid email address'),
});

export const RejectedFormSchema = yup
  .object()
  .noUnknown('Unknown field in form')
  .shape({
    finalStatus: yup
      .string()
      .required('Participant final status is required')
      .oneOf(
        ['withdrawn', 'position filled', 'not qualified', 'not responsive'],
        'Invalid final status'
      ),
  });

export const ParticipantFormSchema = yup
  .object()
  .noUnknown('Unknown field for form')
  .shape({
    // Orbeon Id - only present for parsed XML files
    orbeonId: yup.string().typeError(errorMessage),

    // Eligibility
    eligibility: yup
      .boolean()
      .typeError(errorMessage)
      .required(errorMessage)
      .test('is-true', errorMessage, (v) => v === true),

    // Contact info
    firstName: yup.string().required(errorMessage),
    lastName: yup.string().required(errorMessage),
    phoneNumber: yup
      .string()
      .required(errorMessage)
      .matches(/^\d{10}$/, 'Phone number must be provided as 10 digits'),
    emailAddress: yup.string().required(errorMessage).email('Invalid email address'),
    postalCode: yup
      .string()
      .required(errorMessage)
      .matches(/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/, 'Format as A1A 1A1'),

    // Preferred location
    preferredLocation: yup
      .array()
      .required(errorMessage)
      .of(yup.string().oneOf(healthRegions, 'Invalid location'))
      .test('is-unique-array', 'Preferred locations must be unique', validateUniqueArray),

    // Consent
    consent: yup
      .boolean()
      .typeError(errorMessage)
      .required(errorMessage)
      .test('is-true', errorMessage, (v) => v === true),
  });
