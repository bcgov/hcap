import { healthRegions } from '../constants';
import { validateDateString, validateOptionalDateString, errorMessage } from './helpers';

const yup = require('yup');

export const CreatePSISchema = yup
  .object()
  .noUnknown('Unknown field in entry')
  .shape({
    instituteName: yup.string().required(errorMessage),
    healthAuthority: yup.string().required(errorMessage).oneOf(healthRegions, 'Invalid region'),
    streetAddress: yup.string(),
    city: yup.string(),
    postalCode: yup
      .string()
      .required(errorMessage)
      .matches(/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/, 'Format as A1A 1A1'),
  });

export const CreateCohortSchema = yup
  .object()
  .noUnknown('Unknown field in entry')
  .shape({
    cohort_name: yup.string().required(errorMessage),
    start_date: yup
      .string()
      .required('Start date is required')
      .test('is-date', 'Not a valid date', validateDateString),
    end_date: yup
      .string()
      .required('End date is required')
      .test('is-date', 'Not a valid date', validateDateString),
    cohort_size: yup.number().required('Cohort size is required'),
    psi_id: yup.number().required('Cohort must be mapped to a PSI'),
  });

export const EditCohortSchema = yup
  .object()
  .noUnknown('Unknown field in entry')
  .shape({
    cohortName: yup.string().optional(errorMessage),
    startDate: yup
      .string()
      .optional()
      .test('is-date', 'startDate: Not a valid date', validateOptionalDateString),
    endDate: yup
      .string()
      .optional()
      .test('is-date', 'endDate: Not a valid date', validateOptionalDateString),
    cohortSize: yup.number().optional(),
  });
