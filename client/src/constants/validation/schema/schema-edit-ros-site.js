import * as yup from 'yup';
import { rosEmploymentTypeValues, rosPositionTypeValues } from '../../return-of-service';

export const EditRosSiteSchema = yup
  .object()
  .noUnknown('Unknown field in form')
  .shape({
    startDate: yup.date().required('Start Date at a New Site is required'),
    positionType: yup.string().required('Position Type is required').oneOf(rosPositionTypeValues),
    employmentType: yup.string().optional().oneOf(rosEmploymentTypeValues),
    site: yup.number('Invalid type for New Site').required('New Site Name is required'),
    healthAuthority: yup.string().optional(),
  });
