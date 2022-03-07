const yup = require('yup');
const { healthRegions, siteTypes, roles } = require('../constants');
const { validateBlankOrPositiveInteger, errorMessage, errorMessageIndex } = require('./helpers');

const EmployerFormSchema = yup
  .object()
  .noUnknown('Unknown field in form')
  .shape({
    // Operator Contact Information
    registeredBusinessName: yup.string().nullable(errorMessage),
    operatorName: yup.string().nullable(errorMessage),
    operatorContactFirstName: yup.string().nullable(errorMessage),
    operatorContactLastName: yup.string().nullable(errorMessage),
    operatorEmail: yup.string().nullable(errorMessage).email('Invalid email address'),
    operatorPhone: yup
      .string()
      .matches(/(^[0-9]{10})?$/, 'Phone number must be provided as 10 digits')
      .nullable(true),
    operatorAddress: yup.string().nullable(errorMessage),
    operatorPostalCode: yup
      .string()
      .nullable(errorMessage)
      .matches(/(^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d)?$/, 'Format as A1A 1A1'),

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
      .matches(/(^[0-9]{10})?$/, 'Phone number must be provided as 10 digits')
      .nullable(true),
    emailAddress: yup.string().nullable(errorMessage).email('Invalid email address'),

    // Site type and size info
    check: yup.object().shape(),
    siteType: yup.string().nullable(errorMessage).oneOf(siteTypes, 'Invalid site type'),
    otherSite: yup.string().when('siteType', {
      is: 'Other',
      then: yup.string().nullable('Must specify other site type'),
      otherwise: yup
        .string()
        .nullable()
        .test('is-null', 'Other site type must be null', (v) => v == null || v === ''),
    }),
    numPublicLongTermCare: yup
      .mixed()
      .test(
        'validate-blank-or-number',
        'Must be a positive number',
        validateBlankOrPositiveInteger
      ),
    numPrivateLongTermCare: yup
      .mixed()
      .test(
        'validate-blank-or-number',
        'Must be a positive number',
        validateBlankOrPositiveInteger
      ),
    numPublicAssistedLiving: yup
      .mixed()
      .test(
        'validate-blank-or-number',
        'Must be a positive number',
        validateBlankOrPositiveInteger
      ),
    numPrivateAssistedLiving: yup
      .mixed()
      .test(
        'validate-blank-or-number',
        'Must be a positive number',
        validateBlankOrPositiveInteger
      ),

    // HCAP Request
    hcswFteNumber: yup
      .mixed()
      .test(
        'validate-blank-or-number',
        'Must be a positive number',
        validateBlankOrPositiveInteger
      ),

    // Workforce Baseline
    workforceBaseline: yup
      .array()
      .min(roles.length)
      .max(roles.length)
      .nullable(errorMessage)
      .of(
        yup.object().shape({
          role: yup.string().nullable().oneOf(roles, 'Invalid role'),
          currentFullTime: yup
            .mixed()
            .test(
              'validate-blank-or-number',
              'Must be a positive number',
              validateBlankOrPositiveInteger
            ),
          currentPartTime: yup
            .mixed()
            .test(
              'validate-blank-or-number',
              'Must be a positive number',
              validateBlankOrPositiveInteger
            ),
          currentCasual: yup
            .mixed()
            .test(
              'validate-blank-or-number',
              'Must be a positive number',
              validateBlankOrPositiveInteger
            ),
          vacancyFullTime: yup
            .mixed()
            .test(
              'validate-blank-or-number',
              'Must be a positive number',
              validateBlankOrPositiveInteger
            ),
          vacancyPartTime: yup
            .mixed()
            .test(
              'validate-blank-or-number',
              'Must be a positive number',
              validateBlankOrPositiveInteger
            ),
          vacancyCasual: yup
            .mixed()
            .test(
              'validate-blank-or-number',
              'Must be a positive number',
              validateBlankOrPositiveInteger
            ),
        })
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

const EmployerSiteBatchSchema = yup.array().of(
  yup.lazy((item, options) => {
    const index = options.parent.indexOf(item);
    return yup
      .object()
      .noUnknown(`Unknown field in site data (index ${index})`)
      .shape({
        siteId: yup.number().required(errorMessageIndex(index)),
        siteName: yup.string().required(errorMessageIndex(index)),
        allocation: yup.number().nullable(errorMessageIndex(index)),
        address: yup.string().nullable(errorMessageIndex(index)),
        city: yup.string().nullable(errorMessageIndex(index)),
        isRHO: yup.boolean().nullable().required('Regional Health Office status is required'),
        healthAuthority: yup
          .string()
          .required(errorMessageIndex(index))
          .oneOf(healthRegions, `Invalid location (index ${index})`),
        postalCode: yup
          .string()
          .required(errorMessageIndex(index))
          .matches(/(^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d)$/, {
            excludeEmptyString: true,
            message: `Format as A1A 1A1 (index ${index})`,
          }),
        registeredBusinessName: yup.string().nullable(errorMessageIndex(index)),
        operatorName: yup.string().nullable(errorMessageIndex(index)),
        operatorContactFirstName: yup.string().nullable(errorMessageIndex(index)),
        operatorContactLastName: yup.string().nullable(errorMessageIndex(index)),
        operatorEmail: yup
          .string()
          .email(`should be a valid email address (index ${index})`)
          .nullable(errorMessageIndex(index)),
        operatorPhone: yup
          .string()
          .matches(/^([0-9]{10})$/, {
            excludeEmptyString: true,
            message: `Phone number must be provided as 10 digits (index ${index})`,
          })
          .nullable(errorMessageIndex(index)),
        siteContactFirstName: yup.string().nullable(errorMessageIndex(index)),
        siteContactLastName: yup.string().nullable(errorMessageIndex(index)),
        siteContactPhoneNumber: yup
          .string()
          .matches(/(^[0-9]{10})$/, {
            excludeEmptyString: true,
            message: `Phone number must be provided as 10 digits (index ${index})`,
          })
          .nullable(errorMessageIndex(index)),
        siteContactEmailAddress: yup
          .string()
          .email(`should be a valid email address (index ${index})`)
          .nullable(errorMessageIndex(index)),
      });
  })
);

const CreateSiteSchema = yup
  .object()
  .noUnknown('Unknown field in entry')
  .shape({
    siteId: yup.number().required('Site ID is required'),
    siteName: yup.string().required(errorMessage),
    allocation: yup
      .number()
      .nullable()
      .test(
        'validate-blank-or-number',
        'Must be a positive number',
        validateBlankOrPositiveInteger
      ),
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
      .mixed()
      .nullable()
      .test({
        name: 'isPhone',
        test: (value) => value === '' || !!String(value).match(/^\d{10}$/),
      }),
    siteContactFirstName: yup.string().nullable(),
    siteContactLastName: yup.string().nullable(),
    siteContactPhone: yup
      .mixed()
      .nullable()
      .test({
        name: 'isPhone',
        test: (value) => value === '' || !!String(value).match(/^\d{10}$/),
      }),
    siteContactEmail: yup.string().nullable().email('Invalid email address'),
  });

const EditSiteSchema = yup
  .object()
  .noUnknown('Unknown field in entry')
  .shape({
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
    isRHO: yup.boolean().nullable().required(errorMessage),
    postalCode: yup
      .string()
      .required(errorMessage)
      .matches(/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/, 'Format as A1A 1A1'),
    allocation: yup
      .number()
      .required('Allocation number is required')
      .test(
        'validate-blank-or-number',
        'Must be a positive number',
        validateBlankOrPositiveInteger
      ),
    operatorName: yup.string().nullable(),
    operatorContactFirstName: yup.string().required(errorMessage),
    operatorContactLastName: yup.string().required(errorMessage),
    operatorPhone: yup
      .string()
      .required(errorMessage)
      .matches(/^([0-9]{10})?$/, 'Phone number must be provided as 10 digits'),
    operatorEmail: yup.string().required(errorMessage).email('Invalid email address'),
    history: yup.array().required('Edit history is required'),
  });

module.exports = {
  EmployerFormSchema,
  EmployerSiteBatchSchema,
  CreateSiteSchema,
  EditSiteSchema,
};
