import * as yup from 'yup';

import {
  healthRegions,
  foundOutReasons,
  postHireStatuses,
  postHireStatusesValues,
  participantStatuses,
  sortFields,
  orderDirections,
  ParticipantStatus,
} from '../constants';

import {
  errorMessage,
  errorMessageIndex,
  validateOptionalBooleanMixed,
  validatePreferredLocation,
  validateUniqueArray,
  validateDateString,
} from './helpers';

import { ArchiveRequestDataShape } from './employer-operation';

// TODO: Determine if this is needed
export const ParticipantBatchSchema = yup.array().of(
  yup.lazy((item, options) => {
    const index = options.parent.indexOf(item) + 2;
    const indexName = 'row';
    return yup
      .object()
      .shape({
        // Orbeon Id
        maximusId: yup.number().typeError(errorMessageIndex(index, indexName)),

        // Contact info
        firstName: yup.string().required(errorMessageIndex(index, indexName)),
        lastName: yup.string().required(errorMessageIndex(index, indexName)),
        phoneNumber: yup
          .mixed()
          .required(errorMessage)
          .test({ name: 'isPhone', test: (value) => !!String(value).match(/^\d{10}$/) }),
        emailAddress: yup
          .string()
          .required(errorMessage)
          .email(`should be a valid email address (index ${index})`),
        postalCode: yup
          .string()
          .required(errorMessageIndex(index, indexName))
          .matches(/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/, `Format as A1A 1A1 (row ${index})`),

        // Preferred location
        fraser: yup
          .mixed()
          .optional()
          .test('is-bool-opt', errorMessageIndex(index, indexName), validateOptionalBooleanMixed),
        interior: yup
          .mixed()
          .optional()
          .test('is-bool-opt', errorMessageIndex(index, indexName), validateOptionalBooleanMixed),
        northern: yup
          .mixed()
          .optional()
          .test('is-bool-opt', errorMessageIndex(index, indexName), validateOptionalBooleanMixed),
        vancouverCoastal: yup
          .mixed()
          .optional()
          .test('is-bool-opt', errorMessageIndex(index, indexName), validateOptionalBooleanMixed),
        vancouverIsland: yup
          .mixed()
          .optional()
          .test('is-bool-opt', errorMessageIndex(index, indexName), validateOptionalBooleanMixed),

        // Others
        interested: yup
          .mixed()
          .optional()
          .test('is-bool-opt', errorMessageIndex(index, indexName), validateOptionalBooleanMixed),
        nonHCAP: yup
          .mixed()
          .optional()
          .test('is-bool-opt', errorMessageIndex(index, indexName), validateOptionalBooleanMixed),
        crcClear: yup
          .mixed()
          .optional()
          .test('is-bool-opt', errorMessageIndex(index, indexName), validateOptionalBooleanMixed),
      })
      .test(
        'is-preferred-location-specified',
        () => `Please specify a preferred (EOI) location for participant of row ${index}`,
        validatePreferredLocation
      );
  })
);

export const ParticipantSchema = yup
  .object()
  .noUnknown('Unknown field in form')
  .shape({
    // HCAP program
    program: yup.string().required(errorMessage),

    // Eligibility
    eligibility: yup
      .boolean()
      .typeError(errorMessage)
      .required(errorMessage)
      .test('is-true', errorMessage, (v) => v === true),

    educationalRequirements: yup.string().required(errorMessage),

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
      .matches(/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/, 'Postal code must be in format A1A 1A1'),

    indigenous: yup.string(),
    driverLicense: yup.string().required(errorMessage),

    experienceWithMentalHealthOrSubstanceUse: yup.string().when(['program'], {
      is: (program: string) => program === 'MHAW',
      then: () => yup.string().required(errorMessage),
    }),
    // Preferred location
    preferredLocation: yup
      .array()
      .required(errorMessage)
      .of(yup.string().oneOf(healthRegions, 'Invalid location'))
      .test('is-unique-array', 'Preferred locations must be unique', validateUniqueArray),

    // How did the participant find out about HCAP
    reasonForFindingOut: yup
      .array()
      .of(yup.string().oneOf(foundOutReasons, 'Invalid selection'))
      .test('is-unique-array', 'Each reason must be unique', validateUniqueArray),

    currentOrMostRecentIndustry: yup.string(),
    otherIndustry: yup.string().when(['currentOrMostRecentIndustry'], {
      is: (industry: string) => industry === 'Other, please specify:',
      then: () => yup.string(),
    }),

    roleInvolvesMentalHealthOrSubstanceUse: yup
      .string()
      .when(['program', 'currentOrMostRecentIndustry'], {
        is: (program: string, currentOrMostRecentIndustry: string) =>
          program === 'MHAW' &&
          (currentOrMostRecentIndustry === 'Health care and social assistance' ||
            currentOrMostRecentIndustry === 'Continuing Care and Community Health Care' ||
            currentOrMostRecentIndustry === 'Community Social Services'),
        then: () => yup.boolean(),
      }),

    // Consent
    consent: yup
      .boolean()
      .typeError('Must consent')
      .required('Must consent')
      .test('is-true', 'Must consent', (v) => v === true),
  });

export const ParticipantPostHireStatusSchema = yup
  .object()
  .noUnknown('Unknown field in form')
  .shape({
    participantIds: yup.array().of(yup.number().required('Participant ID is required')),
    status: yup.string().oneOf(postHireStatusesValues, 'Invalid status'),
    data: yup.object().when('status', ([status], schema) => {
      switch (status) {
        case postHireStatuses.postSecondaryEducationCompleted:
          return schema.noUnknown('Unknown field in data form').shape({
            graduationDate: yup
              .string()
              .required('Graduation date is required')
              .test('is-date', 'Invalid date', validateDateString),
          });
        case postHireStatuses.cohortUnsuccessful:
          return schema.noUnknown('Unknown field in data form').shape({
            unsuccessfulCohortDate: yup
              .string()
              .required('Unsuccessful cohort date required.')
              .test('is-date', 'Invalid date', validateDateString),
            continue: yup.string().required().oneOf(['continue_yes', 'continue_no']),
          });
        default:
          return schema.test(
            'is-null-or-empty',
            `${status} does not require a data object`,
            (obj) => !obj || Object.keys(obj).length === 0
          );
      }
    }),
  });

export const ParticipantStatusChange = yup
  .object()
  .noUnknown('Unknown field in form')
  .shape({
    participantId: yup.number().required('Participant ID is required'),
    data: yup.object().when(['status'], ([status], schema) => {
      if (status === 'interviewing') {
        return schema.noUnknown('Unknown field in form').shape({
          contacted_at: yup
            .string()
            .required('Date of contact is required')
            .test('is-date', 'Not a valid date', validateDateString),
        });
      }

      if (status === ParticipantStatus.HIRED) {
        return schema.noUnknown('Unknown field in form').shape({
          startDate: yup
            .string()
            .required('Start date is required')
            .test('is-date', 'Not a valid date', validateDateString),
          hiredDate: yup
            .string()
            .required('Date hired is required')
            .test('is-date', 'Not a valid date', validateDateString),
          nonHcapOpportunity: yup
            .boolean()
            .required('Non-Hcap Opportunity is required as true or false'),
          positionTitle: yup.string().when('nonHcapOpportunity', {
            is: true,
            then: (stringSchema) => stringSchema.required('Position title is required'),
            otherwise: (stringSchema) => stringSchema.nullable(),
          }),
          positionType: yup.string().when('nonHcapOpportunity', {
            is: true,
            then: (stringSchema) =>
              stringSchema
                .required('Position type is required')
                .oneOf(['Full-Time', 'Part-Time', 'Casual'], 'Invalid position type'),
            otherwise: (stringSchema) => stringSchema.nullable(),
          }),
          site: yup.number().required('Site is required'),
        });
      }

      if (status === 'rejected') {
        return schema.noUnknown('Unknown field in form').shape({
          final_status: yup
            .string()
            .required('Participant final status is required')
            .oneOf(
              ['hired by other', 'withdrawn', 'position filled', 'not qualified', 'not responsive'],
              'Invalid final status'
            ),
          previous: yup.string().when('final_status', {
            is: 'hired by other',
            then: (stringSchema) =>
              stringSchema
                .required('Previous status is required')
                .oneOf(['prospecting', 'interviewing', 'offer_made'], 'Invalid previous status'),
            otherwise: (stringSchema) => stringSchema.nullable(),
          }),
        });
      }
      if (status === 'archived') {
        return ArchiveRequestDataShape(schema);
      }

      return schema.test(
        'is-null-or-empty',
        `${status} does not require a data object`,
        (obj) => !obj || Object.keys(obj).length === 0
      );
    }),
    status: yup.string().oneOf(participantStatuses, 'Invalid status'),
    site: yup.number().when(['status'], ([status], schema) => {
      if (['interviewing', 'prospecting', 'prospecting', 'rejected'].includes(status)) {
        // WARN: Change validation to required
        return schema.required('Please specify valid site');
      }
      return schema.optional().nullable();
    }),
    currentStatusId: yup.number().when(['status'], ([status], schema) => {
      if (['interviewing', 'prospecting', 'prospecting', 'rejected'].includes(status))
        return schema.optional();
      return schema.optional().nullable();
    }),
  });

export const ParticipantEditSchema = yup
  .object()
  .noUnknown('Unknown field in entry')
  .shape({
    firstName: yup.string().required('First Name is required'),
    lastName: yup.string().required('Last Name is required'),
    phoneNumber: yup
      .string()
      .required(errorMessage)
      .matches(/^\d{10}$/, 'Phone number must be provided as 10 digits'),
    emailAddress: yup.string().required('Email address is required').email('Invalid email address'),
    interested: yup.string().nullable(),
    postalCode: yup
      .string()
      .nullable()
      .required()
      .matches(/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/),
    postalCodeFsa: yup
      .string()
      .nullable()
      .matches(/^[A-Z]\d[A-Z]$/),
    history: yup.array().required('Edit history is required'),
    id: yup.number().required('User ID is required'),
  });

export const ParticipantQuerySchema = yup.object().shape({
  regionFilter: yup.string().oneOf(healthRegions, 'Invalid region'),
  sortField: yup.string().oneOf(sortFields, 'Invalid sort field'),
  sortDirection: yup.string().oneOf(orderDirections, 'Invalid sort direction'),
  siteSelector: yup.string().matches(/^\d+$/, 'Site Selector must be a `number` type'),
  offset: yup.string().matches(/^\d+$/, 'Offset must be a `number` type'),
  statusFilters: yup.array().of(yup.string().oneOf(participantStatuses, 'Invalid status')),
  showIndigenousOnly: yup.string().equals(['true']),
});
