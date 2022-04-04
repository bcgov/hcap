import * as yup from 'yup';
import mapValues from 'lodash/mapValues';
import { healthRegions, foundOutReasons, siteTypes, userRoles } from './constants';
import {
  validateDateString,
  validatePastDateString,
  validateDateIsInThePast,
  validateDateIsReasonable,
  validateUniqueArray,
  validateBlankOrPositiveInteger,
  errorMessage,
} from './functions';
import { archiveReasonOptions, archiveStatusOptions } from '../archiveParticipantsConstants';
import { indigenousIdentities } from '../../components/modal-forms/IndigenousDeclarationForm';
import { postHireStatuses, postHireStatusesValues } from '../../constants/postHireConstants';
import { rosEmploymentTypeValues, rosPositionTypeValues } from '../return-of-service';

export const genericConfirm = yup.object().shape({
  confirmed: yup.boolean().test('is-true', 'Please confirm', (v) => v === true),
});

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
  endDate: yup.date().when('type', {
    is: 'employmentEnded',
    then: yup
      .date()
      .test('is-present', 'Invalid entry. Date must be in the past.', validateDateIsInThePast)
      .test(
        'is-reasonable',
        'Invalid entry. Date must be after December 31st 1899.',
        validateDateIsReasonable
      )
      .typeError('Invalid Date, must be in the format YYYY/MM/DD'),
  }),
  rehire: yup.string().when('type', {
    is: 'employmentEnded',
    then: yup
      .string()
      .oneOf(['Yes', 'No'], 'Must be either Yes or No.')
      .required("Must be either 'Yes' or 'No'."),
  }),
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
  operatorName: yup.string().nullable(),
  operatorContactFirstName: yup.string().required(errorMessage),
  operatorContactLastName: yup.string().required(errorMessage),
  operatorPhone: yup
    .string()
    .required(errorMessage)
    .matches(/^[0-9]{10}$/, 'Phone number must be provided as 10 digits'),
  operatorEmail: yup.string().required(errorMessage).email('Invalid email address'),
});

export const CreatePSISchema = yup.object().shape({
  instituteName: yup.string().required(errorMessage),
  streetAddress: yup.string(),
  city: yup.string(),
  postalCode: yup
    .string()
    .required(errorMessage)
    .matches(/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/, 'Format as A1A 1A1'),
  healthAuthority: yup.string().required(errorMessage).oneOf(healthRegions, 'Invalid region'),
});

export const IndigenousDeclarationSchema = yup.object().shape({
  isIndigenous: yup.boolean().nullable(),
  [indigenousIdentities.FIRST_NATIONS]: yup.boolean(),
  [indigenousIdentities.INUIT]: yup.boolean(),
  [indigenousIdentities.METIS]: yup.boolean(),
  [indigenousIdentities.OTHER]: yup.boolean(),
  [indigenousIdentities.UNKNOWN]: yup.boolean(),
});

export const EditPSISchema = yup.object().shape({
  instituteName: yup.string().required(errorMessage),
  streetAddress: yup.string().required(errorMessage),
  city: yup.string().required(errorMessage),
  postalCode: yup
    .string()
    .required(errorMessage)
    .matches(/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/, 'Format as A1A 1A1'),
  healthAuthority: yup.string().required(errorMessage).oneOf(healthRegions, 'Invalid region'),
});

export const NewCohortSchema = yup.object().shape({
  cohortName: yup.string().required(errorMessage),
  startDate: yup
    .date()
    .required(errorMessage)
    .test('is-reasonable', 'Invalid year, must be between 1900 and 2100', validateDateIsReasonable)
    .typeError('Start Date is required'),
  endDate: yup
    .date()
    .required(errorMessage)
    .notOneOf([''], 'End Date is required')
    .test('is-reasonable', 'Invalid year, must be between 1900 and 2100', validateDateIsReasonable)
    .when('startDate', (startDate, schema) => {
      return schema.test({
        test: (endDate) => !!startDate && startDate < endDate,
        message: 'End Date must be after Start Date',
      });
    })
    .typeError('End Date is required'),
  cohortSize: yup
    .number()
    .min(1, 'Cohort size must be greater than or equal to 1')
    .required('Cohort size is required'),
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

export const ParticipantEditFormSchema = yup.object().shape({
  phoneNumber: yup
    .string()
    .required(errorMessage)
    .matches(/^\d{10}$/, 'Phone number must be provided as 10 digits'),
  postalCode: yup
    .string()
    .required(errorMessage)
    .matches(/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/, 'Format as A1A 1A1'),
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

    // How did the participant find out about HCAP
    reasonForFindingOut: yup
      .array()
      .required(errorMessage)
      .of(yup.string().oneOf(foundOutReasons, 'Invalid selection'))
      .test('is-unique-array', 'Each reason must be unique', validateUniqueArray),

    // Consent
    consent: yup
      .boolean()
      .typeError(errorMessage)
      .required(errorMessage)
      .test('is-true', errorMessage, (v) => v === true),
  });

export const EmailSubmissionSchema = yup.object().shape({
  email: yup.string().email().required('Required'),
});

export const ParticipantPostHireStatusSchema = yup
  .object()
  .noUnknown('Unknown field in form')
  .shape({
    status: yup
      .string()
      .required('Graduation status is required')
      .oneOf(postHireStatusesValues, 'Invalid status'),
    data: yup.object().when(['status'], (status, schema) => {
      switch (status) {
        case postHireStatuses.postSecondaryEducationCompleted:
          return schema.noUnknown('Unknown field in data form').shape({
            date: yup
              .string()
              .required('Graduation date is required')
              .test('is-date', 'Invalid date', validateDateString),
          });

        case postHireStatuses.cohortUnsuccessful:
          return schema.noUnknown('Unknown field in data form').shape({
            date: yup
              .string()
              .required('Unsuccessful cohort date is required')
              .test('is-date', 'Invalid date', validateDateString),
          });
        default:
          return schema.test(
            'is-null-or-empty',
            `${status} does not require a data object`,
            (obj) => {
              // Since graduation date is a tracked field for the form, I needed to
              return !obj || Object.keys(obj).length === 0 || !obj.date;
            }
          );
      }
    }),
    continue: yup.string().oneOf(['continue_yes', 'continue_no']).required(''),
  });

export const ParticipantAssignCohortSchema = yup
  .object()
  .noUnknown('Unknown field in form')
  .shape({
    cohort: yup.number().required(errorMessage),
    institute: yup.number().required(errorMessage),
  });

export const ReturnOfServiceSchema = yup
  .object()
  .noUnknown('Unknown field in form')
  .shape({
    date: yup
      .date()
      .required('Return of service date is required')
      .test('is-present', 'Invalid entry. Date must be in the past.', validateDateIsInThePast)
      .test(
        'is-reasonable',
        'Invalid entry. Date must be after December 31st 1899.',
        validateDateIsReasonable
      )
      .typeError('Invalid Date, must be in the format YYYY/MM/DD'),
    positionType: yup.string().required('Position Type is required').oneOf(rosPositionTypeValues),
    employmentType: yup
      .string()
      .optional('Please select employment type')
      .oneOf(rosEmploymentTypeValues),
    sameSite: yup
      .boolean()
      .typeError('Same site is boolean')
      .required('Please select if participant is returning to the same site')
      .test(
        'is-true',
        'This feature is currently in development, if you have a participant starting at a different site, please hold off on tracking Return of Service.',
        (v) => v === true
      ),
    confirm: yup
      .boolean()
      .typeError('Confirmation is boolean')
      .required('Please confirm')
      .test('is-true', 'Please confirm', (v) => v === true),
  });
