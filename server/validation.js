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

const sortFields = [
  'id',
  'firstName',
  'lastName',
  'postalCodeFsa',
  'preferredLocation',
  'phoneNumber',
  'emailAddress',
  'nonHCAP',
  'interested',
  'crcClear',
  'status',
  'callbackStatus',
  'statusInfo',
  'userUpdatedAt',
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
  'ministry_of_health',
];

const participantStatuses = [
  'open',
  'prospecting',
  'interviewing',
  'offer_made',
  'hired',
  'rejected',
  'unavailable',
];

const validateDateString = (s) => {
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(s) === false) return false;
  const date = Date.parse(s);
  return typeof date === 'number' && !Number.isNaN(date);
};

const validatePastDateString = (s) => {
  if (!validateDateString(s)) return false;
  return Date.parse(s) <= new Date();
};

const isBooleanValue = (val) => typeof val === 'string' && ['yes', 'no'].includes(val.toLowerCase());

const evaluateBooleanAnswer = (val) => (isBooleanValue(val) && val.toLowerCase() === 'yes');

const validateBlankOrPositiveInteger = (n) => (
  n === '' || typeof n === 'undefined' || n === null || (Number.isInteger(n) && n >= 0)
);

const validateOptionalBooleanMixed = (n) => (
  n === 'NULL' || n === null || typeof n === 'undefined' || (Number.isInteger(n) && n >= 0) || (n && isBooleanValue(n))
);

const validatePreferredLocation = (n) => (typeof n === 'object' && (n.fraser || n.interior || n.vancouverCoastal || n.vancouverIsland || n.northern));

const validateUniqueArray = (a) => (Array.isArray(a) && new Set(a).size === a.length);

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
  operatorEmail: yup.string().nullable(errorMessage).email('Invalid email address'),
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
  emailAddress: yup.string().nullable(errorMessage).email('Invalid email address'),

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
      phaseOneAllocation: yup.number().nullable(errorMessageIndex(index)),
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
      phoneNumber: yup.mixed().required(errorMessage).test({ name: 'isPhone', test: ((value) => !!String(value).match(/\d{10}/)) }),
      emailAddress: yup.string().required(errorMessage).email(`should be a valid email address (index ${index})`),
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

const ParticipantSchema = yup.object().noUnknown('Unknown field in form').shape({
  // Eligibility
  eligibility: yup.boolean().typeError(errorMessage).required(errorMessage).test('is-true', errorMessage, (v) => v === true),

  // Contact info
  firstName: yup.string().required(errorMessage),
  lastName: yup.string().required(errorMessage),
  phoneNumber: yup.string().required(errorMessage).matches(/^\d{10}?$/, 'Phone number must be provided as 10 digits'),
  emailAddress: yup.string().required(errorMessage).email('Invalid email address'),
  postalCode: yup.string().required(errorMessage).matches(/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/, 'Postal code must be in format A1A 1A1'),

  // Preferred location
  preferredLocation: yup.array().required(errorMessage).of(
    yup.string().oneOf(healthRegions, 'Invalid location'),
  ).test('is-unique-array', 'Preferred locations must be unique', validateUniqueArray),

  // Consent
  consent: yup.boolean().typeError('Must consent').required('Must consent').test('is-true', 'Must consent', (v) => v === true),
});

const AccessRequestApproval = yup.object().noUnknown('Unknown field in form').shape({
  userId: yup.string().required('User ID is required'),
  sites: yup.array().when('role', {
    is: 'ministry_of_health',
    then: yup.array().defined(),
    otherwise: yup.array().required('Employer sites are required'),
  }),
  regions: yup.array().when('role', {
    is: 'ministry_of_health',
    then: yup.array().defined(),
    otherwise: yup.array().required('Health regions are required').of(
      yup.string().oneOf(healthRegions, 'Invalid region'),
    ).min(1, 'At least 1 health region is required'),
  }),

  role: yup.string().required('Role is required').oneOf(userRoles, 'Invalid role'),
  acknowledgement: yup.boolean().when('role', {
    is: 'ministry_of_health',
    then: yup.boolean().test('is-true', 'Must acknowledge admission of MoH user', (v) => v === true),
    otherwise: yup.boolean().test('is-bool-opt', 'acknowlegement must be boolean', (v) => v === false),
  }),
});

const ParticipantStatusChange = yup.object().noUnknown('Unknown field in form').shape({
  participantId: yup.number().required('Participant ID is required'),
  data: yup.object().when(['status'], (status, schema) => {
    if (status === 'interviewing') {
      return schema.noUnknown('Unknown field in form').shape({
        contacted_at: yup.string().required('Date of contact is required').test('is-date', 'Not a valid date', validateDateString),
      });
    }

    if (status === 'hired') {
      return schema.noUnknown('Unknown field in form').shape({
        startDate: yup.string().required('Start date is required').test('is-date', 'Not a valid date', validateDateString),
        hiredDate: yup.string().required('Date hired is required').test('is-date', 'Not a valid date', validateDateString),
        nonHcapOpportunity: yup.boolean().required('Non-Hcap Opportunity is required as true or false'),
        positionTitle: yup.string().when('nonHcapOpportunity', {
          is: true,
          then: yup.string().required('Position title is required'),
          otherwise: yup.string().nullable(),
        }),
        positionType: yup.string().when('nonHcapOpportunity', {
          is: true,
          then: yup.string().required('Position type is required').oneOf(['Full-Time', 'Part-Time', 'Casual'], 'Invalid position type'),
          otherwise: yup.string().nullable(),
        }),
        site: yup.number().required('Site is required'),
      });
    }

    if (status === 'rejected') {
      return schema.noUnknown('Unknown field in form').shape({
        final_status: yup.string().required('Participant final status is required').oneOf(['hired by other', 'withdrawn', 'position filled', 'not qualified', 'not responsive'], 'Invalid final status'),
        previous: yup.string().when('final_status', {
          is: 'hired by other',
          then: yup.string().required('Previous status is required').oneOf(['prospecting', 'interviewing', 'offer_made'], 'Invalid previous status'),
          otherwise: yup.string().nullable(),
        }),
      });
    }

    return schema.test('is-null-or-empty', `${status} does not require a data object`, (obj) => !obj || Object.keys(obj).length === 0);
  }),
  status: yup.string().oneOf(participantStatuses, 'Invalid status'),
});

const ExternalHiredParticipantSchema = yup.object().shape({
  firstName: yup.string().required('First Name is required'),
  lastName: yup.string().required('Last Name is required'),
  phoneNumber: yup.string().required(errorMessage).matches(/^[0-9]{10}$/, 'Phone number must be provided as 10 digits'),
  emailAddress: yup.string().required(errorMessage).email('Invalid email address'),
  origin: yup.string().required('Must indicate origin of offer').oneOf(['internal', 'other'], 'Invalid entry'),
  otherOrigin: yup.string().when('origin', {
    is: 'other',
    then: yup.string().required('Please specify'),
    otherwise: yup.string().nullable().test('is-null', 'Other origin must be null', (v) => v == null || v === ''),
  }),
  hcapOpportunity: yup.boolean().test('is-true', 'Must be HCAP opportunity', (v) => v === true),
  contactedDate: yup.string().required('Date of contact is required').test('is-date', 'Not a valid date in the past', validatePastDateString),
  hiredDate: yup.string().required('Date hired is required').test('is-date', 'Not a valid date', validateDateString),
  startDate: yup.string().required('Start date is required').test('is-date', 'Not a valid date', validateDateString),
  site: yup.number().required('Site is required'),
  acknowledge: yup.boolean().test('is-true', 'Must acknowledge participant acceptance', (v) => v === true),
});

const ParticipantQuerySchema = yup.object().shape({
  regionFilter: yup.string().oneOf(healthRegions, 'Invalid region'),
  sortField: yup.string().oneOf(sortFields, 'Invalid sort field'),
  sortDirection: yup.string().oneOf(orderDirections, 'Invalid sort direction'),
  offset: yup.string().matches(/^\d+$/, 'Offset must be a `number` type'),
  statusFilters: yup.array().of(
    yup.string().oneOf(participantStatuses, 'Invalid status'),
  ),
});

const ParticipantEditSchema = yup.object().noUnknown('Unknown field in entry').shape({
  firstName: yup.string().required('First Name is required'),
  lastName: yup.string().required('Last Name is required'),
  phoneNumber: yup.string().required(errorMessage).matches(/^[0-9]{10}$/, 'Phone number must be provided as 10 digits'),
  emailAddress: yup.string().required('Email address is required').email('Invalid email address'),
  interested: yup.string().nullable(),
  history: yup.array().required('Edit history is required'),
  id: yup.number().required('User ID is required'),
});

const EditSiteSchema = yup.object().shape({
  siteContactFirstName: yup.string().required(errorMessage),
  siteContactLastName: yup.string().required(errorMessage),
  siteContactPhone: yup.string().required(errorMessage).matches(/^[0-9]{10}$/, 'Phone number must be provided as 10 digits'),
  siteContactEmail: yup.string().required(errorMessage).email('Invalid email address'),
  siteName: yup.string().required(errorMessage),
  registeredBusinessName: yup.string().required(errorMessage),
  address: yup.string().required(errorMessage),
  city: yup.string().required(errorMessage),
  postalCode: yup.string().required(errorMessage).matches(/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/, 'Format as A1A 1A1'),
  phaseOneAllocation: yup.number().required('Allocation number is required').test('validate-blank-or-number', 'Must be a positive number', validateBlankOrPositiveInteger),
  operatorContactFirstName: yup.string().required(errorMessage),
  operatorContactLastName: yup.string().required(errorMessage),
  operatorPhone: yup.string().required(errorMessage).matches(/^([0-9]{10})?$/, 'Phone number must be provided as 10 digits'),
  operatorEmail: yup.string().required(errorMessage).email('Invalid email address'),
  history: yup.array().required('Edit history is required'),
});

const validate = async (schema, data) => schema.validate(data, { strict: true });

module.exports = {
  ParticipantSchema,
  EmployerFormSchema,
  ParticipantBatchSchema,
  ParticipantStatusChange,
  ExternalHiredParticipantSchema,
  validate,
  isBooleanValue,
  evaluateBooleanAnswer,
  AccessRequestApproval,
  ParticipantQuerySchema,
  ParticipantEditSchema,
  EmployerSiteBatchSchema,
  EditSiteSchema,
};
