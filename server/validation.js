/* eslint-disable max-len */
const yup = require('yup');
const {
  healthRegions, roles, siteTypes, errorMessage, errorMessageRow,
} = require('./validators');

const validateBlankOrPositiveInteger = (n) => (
  n === '' || typeof n === 'undefined' || n === null || (Number.isInteger(n) && n >= 0)
);

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
  healthAuthority: yup.string().nullable(errorMessage).oneOf(healthRegions, 'Invalid location'),
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

const EmployeeBatchSchema = yup.array().of(
  yup.lazy((item, options) => {
    const row = options.parent.indexOf(item) + 1;
    return yup.object().noUnknown(`Unknown field in employee row ${row}`).shape({
      // Orbeon Id
      maximusId: yup.string().typeError(errorMessageRow(row)),

      // Eligibility
      eligibility: yup.boolean().typeError(errorMessageRow(row)).required(errorMessageRow(row)).test('is-true', errorMessageRow(row), (v) => v === true),

      // Contact info
      firstName: yup.string().required(errorMessageRow(row)),
      lastName: yup.string().required(errorMessageRow(row)),
      phoneNumber: yup.string().required(errorMessageRow(row)),
      emailAddress: yup.string().required(errorMessageRow(row)).matches(/^(.+@.+\..+)?$/, `Invalid email address (row ${row})`),
      postalCode: yup.string().required(errorMessageRow(row)).matches(/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/, `Format as A1A 1A1 (row ${row})`),

      // Preferred location
      preferredLocation: yup.string().test('is-region-array', errorMessageRow(row), () => true),

      // Consent
      consent: yup.boolean().typeError(errorMessageRow(row)).required(errorMessageRow(row)).test('is-true', errorMessageRow(row), (v) => v === true),
    });
  }),
);

const validate = async (schema, data) => schema.validate(data, { strict: true });

module.exports = {
  EmployerFormSchema, EmployeeBatchSchema, validate,
};
