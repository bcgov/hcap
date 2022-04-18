import * as yup from 'yup';

export const RejectedFormSchema = yup
  .object()
  .noUnknown('Unknown field in form')
  .shape({
    finalStatus: yup
      .string()
      .required('Participant final status is required')
      .oneOf(
        ['withdrawn', 'position filled', 'not qualified', 'not responsive'],
        'Invalid final status'
      ),
  });
