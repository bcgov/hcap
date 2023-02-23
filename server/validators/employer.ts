import * as yup from 'yup';
import { healthRegions, siteTypes, roles } from '../constants';
import { validateBlankOrPositiveInteger, errorMessage, errorMessageIndex } from './helpers';

export const EmployerFormSchema = yup
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
      .matches(/(^\d{10})?$/, 'Phone number must be provided as 10 digits')
      .nullable(),
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
      .matches(/(^\d{10})?$/, 'Phone number must be provided as 10 digits')
      .nullable(),
    emailAddress: yup.string().nullable(errorMessage).email('Invalid email address'),

    // Site type and size info
    siteType: yup.string().nullable(errorMessage).oneOf(siteTypes, 'Invalid site type'),
    otherSite: yup.string().when('siteType', {
      is: 'Other',
      then: (stringSchema) => stringSchema.nullable('Must specify other site type'),
      otherwise: (stringSchema) =>
        stringSchema
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

export const EmployerSiteBatchSchema = yup.array().of(
  yup.lazy((item, options) => {
    const index = options.parent.indexOf(item);
    const indexName = 'row';
    return yup
      .object()
      .noUnknown(`Unknown field in site data (index ${index})`)
      .shape({
        siteId: yup.number().required(errorMessageIndex(index, indexName)),
        siteName: yup.string().required(errorMessageIndex(index, indexName)),
        address: yup.string().nullable(errorMessageIndex(index, indexName)),
        city: yup.string().nullable(errorMessageIndex(index, indexName)),
        isRHO: yup.boolean().nullable().required('Regional Health Office status is required'),
        healthAuthority: yup
          .string()
          .required(errorMessageIndex(index, indexName))
          .oneOf(healthRegions, `Invalid location (index ${index})`),
        postalCode: yup
          .string()
          .required(errorMessageIndex(index, indexName))
          .matches(/(^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d)$/, {
            excludeEmptyString: true,
            message: `Format as A1A 1A1 (index ${index})`,
          }),
        registeredBusinessName: yup.string().nullable(errorMessageIndex(index, indexName)),
        operatorName: yup.string().nullable(errorMessageIndex(index, indexName)),
        operatorContactFirstName: yup.string().nullable(errorMessageIndex(index, indexName)),
        operatorContactLastName: yup.string().nullable(errorMessageIndex(index, indexName)),
        operatorEmail: yup
          .string()
          .email(`should be a valid email address (index ${index})`)
          .nullable(errorMessageIndex(index, indexName)),
        operatorPhone: yup
          .string()
          .matches(/^(\d{10})$/, {
            excludeEmptyString: true,
            message: `Phone number must be provided as 10 digits (index ${index})`,
          })
          .nullable(errorMessageIndex(index, indexName)),
        siteContactFirstName: yup.string().nullable(errorMessageIndex(index, indexName)),
        siteContactLastName: yup.string().nullable(errorMessageIndex(index, indexName)),
        siteContactPhoneNumber: yup
          .string()
          .matches(/(^\d{10})$/, {
            excludeEmptyString: true,
            message: `Phone number must be provided as 10 digits (index ${index})`,
          })
          .nullable(errorMessageIndex(index, indexName)),
        siteContactEmailAddress: yup
          .string()
          .email(`should be a valid email address (index ${index})`)
          .nullable(errorMessageIndex(index, indexName)),
      });
  })
);

export const CreateSiteSchema = yup
  .object()
  .noUnknown('Unknown field in entry')
  .shape({
    siteId: yup.number().required('Site ID is required'),
    siteName: yup.string().required(errorMessage),
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

export const EditSiteSchema = yup
  .object()
  .noUnknown('Unknown field in entry')
  .shape({
    siteContactFirstName: yup.string().required(errorMessage),
    siteContactLastName: yup.string().required(errorMessage),
    siteContactPhone: yup
      .string()
      .required(errorMessage)
      .matches(/^\d{10}$/, 'Phone number must be provided as 10 digits'),
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
    operatorName: yup.string().nullable(),
    operatorContactFirstName: yup.string().required(errorMessage),
    operatorContactLastName: yup.string().required(errorMessage),
    operatorPhone: yup
      .string()
      .required(errorMessage)
      .matches(/^(\d{10})?$/, 'Phone number must be provided as 10 digits'),
    operatorEmail: yup.string().required(errorMessage).email('Invalid email address'),
    history: yup.array().required('Edit history is required'),
  });
