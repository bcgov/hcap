/* eslint-disable max-len */
const yup = require('yup');

const healthRegions = [
  'Interior',
  'Fraser',
  'Vancouver Coastal',
  'Vancouver Island',
  'Northern',
];

const orderDirections = [
  'desc',
  'asc',
];

const paginationFields = [
  'id',
  'firstName',
  'lastName',
  'postalCodeFsa',
  'preferredLocation',
  'phoneNumber',
  'emailAddress',
  'nonHCAP',
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
  'health_authority',
  'employer',
];

const participantStatuses = [
  'open',
  'prospecting',
  'interviewing',
  'offer_made',
  'hired',
  'rejected',
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

const errorMessageIndex = (index, indexName) => (error) => `${errorMessage(error)} (${indexName || 'index'} ${index})`;

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
  check: yup.object().shape(),
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

const EmployerSiteBatchSchema = yup.array().of(
  yup.lazy((item, options) => {
    const index = options.parent.indexOf(item);
    return yup.object().noUnknown(`Unknown field in site data (index ${index})`).shape({
      siteId: yup.number().required(errorMessageIndex(index)),
      siteName: yup.string().required(errorMessageIndex(index)),
      earlyAdopterAllocation: yup.number().nullable(errorMessageIndex(index)),
      address: yup.string().nullable(errorMessageIndex(index)),
      city: yup.string().nullable(errorMessageIndex(index)),
      healthAuthority: yup.string().required(errorMessageIndex(index)).oneOf(healthRegions, `Invalid location (index ${index})`),
      postalCode: yup.string().required(errorMessageIndex(index)).matches(/(^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d)$/, { excludeEmptyString: true, message: `Format as A1A 1A1 (index ${index})` }),
      registeredBusinessName: yup.string().nullable(errorMessageIndex(index)),
      operatorName: yup.string().nullable(errorMessageIndex(index)),
      operatorContactFirstName: yup.string().nullable(errorMessageIndex(index)),
      operatorContactLastName: yup.string().nullable(errorMessageIndex(index)),
      operatorEmail: yup.string().email(`should be a valid email address (index ${index})`).nullable(errorMessageIndex(index)),
      operatorPhone: yup.string().matches(/^([0-9]{10})$/, { excludeEmptyString: true, message: `Phone number must be provided as 10 digits (index ${index})` }).nullable(errorMessageIndex(index)),
      siteContactFirstName: yup.string().nullable(errorMessageIndex(index)),
      siteContactLastName: yup.string().nullable(errorMessageIndex(index)),
      siteContactPhoneNumber: yup.string().matches(/(^[0-9]{10})$/, { excludeEmptyString: true, message: `Phone number must be provided as 10 digits (index ${index})` }).nullable(errorMessageIndex(index)),
      siteContactEmailAddress: yup.string().email(`should be a valid email address (index ${index})`).nullable(errorMessageIndex(index)),
    });
  }),
);

const ParticipantBatchSchema = yup.array().of(
  yup.lazy((item, options) => {
    const index = options.parent.indexOf(item) + 2;
    const indexName = 'row';
    return yup.object().shape({
      // Orbeon Id
      maximusId: yup.number().typeError(errorMessageIndex(index, indexName)),

      // Contact info
      firstName: yup.string().required(errorMessageIndex(index, indexName)),
      lastName: yup.string().required(errorMessageIndex(index, indexName)),
      phoneNumber: yup.mixed().required(errorMessageIndex(index, indexName)),
      emailAddress: yup.string().required(errorMessageIndex(index, indexName)).matches(/^(.+@.+\..+)?$/, `Invalid email address (row ${index})`),
      postalCode: yup.string().required(errorMessageIndex(index, indexName)).matches(/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/, `Format as A1A 1A1 (row ${index})`),

      // Preferred location
      fraser: yup.mixed().optional(errorMessageIndex(index, indexName)).test('is-bool-opt', errorMessageIndex(index, indexName), validateOptionalBooleanMixed),
      interior: yup.mixed().optional(errorMessageIndex(index, indexName)).test('is-bool-opt', errorMessageIndex(index, indexName), validateOptionalBooleanMixed),
      northern: yup.mixed().optional(errorMessageIndex(index, indexName)).test('is-bool-opt', errorMessageIndex(index, indexName), validateOptionalBooleanMixed),
      vancouverCoastal: yup.mixed().optional(errorMessageIndex(index, indexName)).test('is-bool-opt', errorMessageIndex(index, indexName), validateOptionalBooleanMixed),
      vancouverIsland: yup.mixed().optional(errorMessageIndex(index, indexName)).test('is-bool-opt', errorMessageIndex(index, indexName), validateOptionalBooleanMixed),
      // Others
      interested: yup.mixed().optional(errorMessageIndex(index, indexName)).test('is-bool-opt', errorMessageIndex(index, indexName), validateOptionalBooleanMixed),
      nonHCAP: yup.mixed().optional(errorMessageIndex(index, indexName)).test('is-bool-opt', errorMessageIndex(index, indexName), validateOptionalBooleanMixed),
      crcClear: yup.mixed().optional(errorMessageIndex(index, indexName)).test('is-bool-opt', errorMessageIndex(index, indexName), validateOptionalBooleanMixed),
    }).test('is-preferred-location-specified', () => `Please specify a preferred (EOI) location for participant of row ${index}`, validatePreferredLocation);
  }),
);

const AccessRequestApproval = yup.object().noUnknown('Unknown field in form').shape({
  userId: yup.string().required('User ID is required'),
  sites: yup.array().required('Employer sites are required').min(1, 'At least 1 employer site is required'),
  regions: yup.array().required('Health regions are required').of(
    yup.string().oneOf(healthRegions, 'Invalid region'),
  ).min(1, 'At least 1 health region is required'),
  role: yup.string().required('Role is required').oneOf(userRoles, 'Invalid role'),
});

const ParticipantStatusChange = yup.object().noUnknown('Unknown field in form').shape({
  participantId: yup.number().required('Participant ID is required'),
  data: yup.object(),
  status: yup.string().oneOf(participantStatuses, 'Invalid region'),
});

const ParticipantQuerySchema = yup.object().shape({
  regionFilter: yup.string().oneOf(healthRegions, 'Invalid region'),
  field: yup.string().oneOf(paginationFields, 'Invalid field'),
  direction: yup.string().oneOf(orderDirections, 'Invalid direction'),
});

const validate = async (schema, data) => schema.validate(data, { strict: true });

module.exports = {
  EmployerFormSchema,
  ParticipantBatchSchema,
  ParticipantStatusChange,
  validate,
  isBooleanValue,
  evaluateBooleanAnswer,
  AccessRequestApproval,
  ParticipantQuerySchema,
  EmployerSiteBatchSchema,
};
