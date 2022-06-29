import * as yup from 'yup';
import { rosEmploymentTypeValues, rosPositionTypeValues } from '../../return-of-service';

export const ChangeRosSiteSchema = yup
  .object()
  .noUnknown('Unknown field in form')
  .shape({
    startDate: yup.date().required('Start Date is required'),
    positionType: yup.string().required('Position Type is required').oneOf(rosPositionTypeValues),
    employmentType: yup.string().optional().oneOf(rosEmploymentTypeValues),
    site: yup.number().required('New Site is required'),
    healthAuthority: yup.number().required('Health Authority is required'),
  });
