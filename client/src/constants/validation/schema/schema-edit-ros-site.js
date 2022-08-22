import * as yup from 'yup';

export const EditRosSiteSchema = yup.object().shape({
  siteName: yup.number('Invalid type for the new site').required('New site name is required'),
});
