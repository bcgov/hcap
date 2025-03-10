import * as yup from 'yup';
import { rosPositionTypeValues, rosEmploymentTypeValues } from '../constants';
import { validISODateString } from './helpers';

export const CreateReturnOfServiceSchema = yup
  .object()
  .noUnknown('Unknown field in form')
  .shape({
    status: yup.string().optional(),
    siteId: yup.number().optional(),
    data: yup
      .object()
      .required('Data object is required')
      .shape({
        date: yup
          .string()
          .required('Return of service date (data.date) is required')
          .test('is-date', 'Not a valid date', validISODateString),
        positionType: yup
          .string()
          .required('Position Type (data.positionType) is required')
          .oneOf(rosPositionTypeValues),
        employmentType: yup
          .string()
          .required('Employment Type is required')
          .oneOf(rosEmploymentTypeValues),
        sameSite: yup.boolean().required('Same Site flag (data.sameSite) is required'),
      }),
  });

export const ChangeReturnOfServiceSiteSchema = yup
  .object()
  .noUnknown('Unknown field in form')
  .shape({
    status: yup.string().optional(),
    data: yup
      .object()
      .required('Data object is required')
      .shape({
        date: yup.string().optional(),
        site: yup.number().required('New Site id is required and must specify an employer side id'),
        startDate: yup
          .string()
          .required('Start date at a new site (data.startDate) is required')
          .test('is-date', 'Not a valid date', validISODateString),
        positionType: yup
          .string()
          .required('Position Type (data.positionType) is required')
          .oneOf(rosPositionTypeValues),
        employmentType: yup
          .string()
          .required('Employment Type is required')
          .oneOf(rosEmploymentTypeValues),
      }),
  });

export const UpdateReturnOfServiceSchema = yup
  .object()
  .noUnknown('Unknown field in form')
  .shape({
    isUpdating: yup.boolean().optional(),
    data: yup.object().required('Data object is required').shape({
      date: yup.string().optional(),
      startDate: yup.string().optional(),
      site: yup.number().optional(),
    }),
  });
