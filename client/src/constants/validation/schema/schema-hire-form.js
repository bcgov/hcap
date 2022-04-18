import * as yup from 'yup';
import { validateDateString, validatePastDateString } from '../functions';

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
