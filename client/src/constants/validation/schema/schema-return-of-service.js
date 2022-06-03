import * as yup from 'yup';
import { validateDateIsInThePast, validateDateIsReasonable } from '../functions';
import { rosEmploymentTypeValues, rosPositionTypeValues } from '../../return-of-service';

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
      .required('Please select if participant is returning to the same site'),
    confirm: yup
      .boolean()
      .typeError('Confirmation is boolean')
      .required('Please confirm')
      .test('is-true', 'Please confirm', (v) => v === true),
    site: yup.number('Site should be number').when(['sameSite'], (sameSite, schema) => {
      return !sameSite ? schema.required('Site is required') : schema.optional().nullable();
    }),
  });
