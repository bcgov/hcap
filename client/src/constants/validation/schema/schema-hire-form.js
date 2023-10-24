import * as yup from 'yup';
import { validateDateString, validatePastDateString } from '../functions';
import { Program } from '../../participantTableConstants';

export const HireFormSchema = yup
  .object()
  .noUnknown('Unknown field in form')
  .shape({
    program: yup.string().oneOf(Object.values(Program)).required(`Program is required`),
    startDate: yup
      .string()
      .required('Start date is required')
      .test('is-date', 'Not a valid date', validateDateString),
    hiredDate: yup
      .string()
      .required('Date hired is required')
      .test('is-date', 'Not a valid date in the past', validatePastDateString),
    acknowledge: yup
      .boolean()
      .test('is-true', 'Must acknowledge participant acceptance', (v) => v === true),
    positionTitle: yup.string().when('program', {
      is: Program.NonHCAP,
      then: yup.string().required('Position title is required'),
      otherwise: yup.string().nullable(),
    }),
    positionType: yup.string().when('program', {
      is: Program.NonHCAP,
      then: yup
        .string()
        .required('Position type is required')
        .oneOf(['Full-Time', 'Part-Time', 'Casual'], 'Invalid position type'),
      otherwise: yup.string().nullable(),
    }),
    site: yup.number().required('Site is required'),
  });
