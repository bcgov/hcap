import * as yup from 'yup';

export const ProspectingSitesSchema = yup.object().shape({
  prospectingSites: yup.array().required('This field is required: please select at least 1 site'),
});

export const ProspectingSiteSchema = yup
  .object()
  .noUnknown('Unknown field')
  .shape({
    prospectingSite: yup
      .number()
      .required('This field is required: please select a prospecting site')
      .min(0, 'This field is required: please select a valid prospecting site'),
  });
