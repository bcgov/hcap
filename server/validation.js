/* eslint-disable max-len */
const yup = require('yup');

const healthRegions = [
  'Interior',
  'Fraser',
  'Vancouver Coastal',
  'Vancouver Island',
  'Northern',
];

const roles = [
  'Registered Nurse',
  'Licensed Practical Nurse',
  'Health Care Assistant',
  'Food Services Worker',
  'Housekeeping',
  'COVID-19 IPC Response',
  'Site Administrative Staff',
];

const siteTypes = [
  'Long-term care',
  'Assisted living',
  'Both',
  'Other',
  '',
];

const userRoles = [
  'ministry_of_health',
];

const isBooleanValue = (val) => typeof val === 'string' && ['yes', 'no'].includes(val.toLowerCase());

const evaluateBooleanAnswer = (val) => (isBooleanValue(val) && val.toLowerCase() === 'yes');

const validateBlankOrPositiveInteger = (n) => (
  n === '' || typeof n === 'undefined' || n === null || (Number.isInteger(n) && n >= 0)
);

const validateOptionalBooleanMixed = (n) => (
  n === 'NULL' || n === null || typeof n === 'undefined' || (Number.isInteger(n) && n >= 0) || (n && isBooleanValue(n))
);

const validatePreferredLocation = (n) => (typeof n === 'object' && (n.fraser || n.interior || n.vancouverCoastal || n.vancouverIsland || n.northern));

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
    eligibility: 'We\'re sorry, but current eligibility to work in Canada is a requirement to submit this form.',
    preferredLocation: 'Please select at least one location you\'d like to work in.',
    consent: 'We\'re sorry, but we cannot process your request without permission.',
  };
  return errorMessages[path] || `Failed validation on ${path}`;
};

const errorMessageRow = (index) => (error) => `${errorMessage(error)} (row ${index})`;

const EmployerFormSchema = yup.object().noUnknown('Unknown field in form').shape({
  // Operator Contact Information
  registeredBusinessName: yup.string().nullable(errorMessage),
  operatorName: yup.string().nullable(errorMessage),
  operatorContactFirstName: yup.string().nullable(errorMessage),
  operatorContactLastName: yup.string().nullable(errorMessage),
  operatorEmail: yup.string().nullable(errorMessage).matches(/(^(.+@.+\..+)?)?$/, 'Invalid email address'),
  operatorPhone: yup.string().matches(/(^[0-9]{10})?$/, 'Phone number must be provided as 10 digits').nullable(true),
  operatorAddress: yup.string().nullable(errorMessage),
  operatorPostalCode: yup.string().nullable(errorMessage).matches(/(^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d)?$/, 'Format as A1A 1A1'),

  // Site contact info
  siteName: yup.string().nullable(errorMessage),
  address: yup.string().nullable(errorMessage),
  healthAuthority: yup.string().nullable(errorMessage).oneOf([...healthRegions, ''], 'Invalid location'),
  siteContactFirstName: yup.string().nullable(errorMessage),
  siteContactLastName: yup.string().nullable(errorMessage),
  phoneNumber: yup.string().matches(/(^[0-9]{10})?$/, 'Phone number must be provided as 10 digits').nullable(true),
  emailAddress: yup.string().nullable(errorMessage).matches(/(^(.+@.+\..+)?)?$/, 'Invalid email address'),

  // Site type and size info
  siteType: yup.string().nullable(errorMessage).oneOf(siteTypes, 'Invalid site type'),
  otherSite: yup.string().when('siteType', {
    is: 'Other',
    then: yup.string().nullable('Must specify other site type'),
    otherwise: yup.string().nullable().test('is-null', 'Other site type must be null', (v) => v == null || v === ''),
  }),
  numPublicLongTermCare: yup.mixed().test('validate-blank-or-number', 'Must be a positive number', validateBlankOrPositiveInteger),
  numPrivateLongTermCare: yup.mixed().test('validate-blank-or-number', 'Must be a positive number', validateBlankOrPositiveInteger),
  numPublicAssistedLiving: yup.mixed().test('validate-blank-or-number', 'Must be a positive number', validateBlankOrPositiveInteger),
  numPrivateAssistedLiving: yup.mixed().test('validate-blank-or-number', 'Must be a positive number', validateBlankOrPositiveInteger),

  // HCAP Request
  hcswFteNumber: yup.mixed().test('validate-blank-or-number', 'Must be a positive number', validateBlankOrPositiveInteger),

  // Workforce Baseline
  workforceBaseline: yup.array().min(roles.length).max(roles.length).nullable(errorMessage)
    .of(yup.object().shape({
      role: yup.string().nullable().oneOf(roles, 'Invalid role'),
      currentFullTime: yup.mixed().test('validate-blank-or-number', 'Must be a positive number', validateBlankOrPositiveInteger),
      currentPartTime: yup.mixed().test('validate-blank-or-number', 'Must be a positive number', validateBlankOrPositiveInteger),
      currentCasual: yup.mixed().test('validate-blank-or-number', 'Must be a positive number', validateBlankOrPositiveInteger),
      vacancyFullTime: yup.mixed().test('validate-blank-or-number', 'Must be a positive number', validateBlankOrPositiveInteger),
      vacancyPartTime: yup.mixed().test('validate-blank-or-number', 'Must be a positive number', validateBlankOrPositiveInteger),
      vacancyCasual: yup.mixed().test('validate-blank-or-number', 'Must be a positive number', validateBlankOrPositiveInteger),
    })),

  // Staffing Challenges
  staffingChallenges: yup.string().nullable(),

  // Certification
  doesCertify: yup.boolean().typeError(errorMessage).required(errorMessage).test('is-true', errorMessage, (v) => v === true),
});

const ParticipantBatchSchema = yup.array().of(
  yup.lazy((item, options) => {
    const row = options.parent.indexOf(item) + 2;
    return yup.object().shape({
      // Orbeon Id
      maximusId: yup.number().typeError(errorMessageRow(row)),

      // Contact info
      firstName: yup.string().required(errorMessageRow(row)),
      lastName: yup.string().required(errorMessageRow(row)),
      phoneNumber: yup.mixed().required(errorMessageRow(row)),
      emailAddress: yup.string().required(errorMessageRow(row)).matches(/^(.+@.+\..+)?$/, `Invalid email address (row ${row})`),
      postalCode: yup.string().required(errorMessageRow(row)).matches(/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/, `Format as A1A 1A1 (row ${row})`),

      // Preferred location
      fraser: yup.mixed().optional(errorMessageRow(row)).test('is-bool-opt', errorMessageRow(row), validateOptionalBooleanMixed),
      interior: yup.mixed().optional(errorMessageRow(row)).test('is-bool-opt', errorMessageRow(row), validateOptionalBooleanMixed),
      northern: yup.mixed().optional(errorMessageRow(row)).test('is-bool-opt', errorMessageRow(row), validateOptionalBooleanMixed),
      vancouverCoastal: yup.mixed().optional(errorMessageRow(row)).test('is-bool-opt', errorMessageRow(row), validateOptionalBooleanMixed),
      vancouverIsland: yup.mixed().optional(errorMessageRow(row)).test('is-bool-opt', errorMessageRow(row), validateOptionalBooleanMixed),
      // Others
      interested: yup.mixed().optional(errorMessageRow(row)).test('is-bool-opt', errorMessageRow(row), validateOptionalBooleanMixed),
      nonHCAP: yup.mixed().optional(errorMessageRow(row)).test('is-bool-opt', errorMessageRow(row), validateOptionalBooleanMixed),
      crcClear: yup.mixed().optional(errorMessageRow(row)).test('is-bool-opt', errorMessageRow(row), validateOptionalBooleanMixed),
    }).test('is-preferred-location-specified', () => `Please specify a preferred (EOI) location for participant of row ${row}`, validatePreferredLocation);
  }),
);

const AccessRequestApproval = yup.object().noUnknown('Unknown field in form').shape({
  userId: yup.string().required('User ID is required'),
  region: yup.string().required('Region is required').oneOf(healthRegions, 'Invalid region'),
  role: yup.string().required('Role is required').oneOf(userRoles, 'Invalid role'),
});

const validate = async (schema, data) => schema.validate(data, { strict: true });

module.exports = {
  EmployerFormSchema, ParticipantBatchSchema, validate, isBooleanValue, evaluateBooleanAnswer, AccessRequestApproval,
};
