import * as yup from 'yup';
import mapValues from 'lodash/mapValues';
import { healthRegions, siteTypes } from '../constants';
import { validateBlankOrPositiveInteger, errorMessage } from '../functions';

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
    siteName: yup
      .string()
      .nullable(errorMessage)
      .max(255, 'Site name should be no longer than 255 characters'),
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
