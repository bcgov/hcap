import * as yup from 'yup';

export const ProspectingSitesSchema = yup.object().shape({
  prospectingSites: yup.array().required('This field is required: please select at least 1 site'),
});
