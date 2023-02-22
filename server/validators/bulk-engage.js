import * as yup from 'yup';

export const BulkEngageParticipantSchema = yup
  .object()
  .noUnknown('Unknown field in form')
  .shape({
    participants: yup.array().of(yup.number()).required('Array of participant ids is required'),
    sites: yup
      .array()
      .of(
        yup.object().shape({
          id: yup.number().required('Site id is required'),
        })
      )
      .required('Array of sites is required'),
  });
