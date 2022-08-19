import * as yup from 'yup';

export const CreatePhaseSchema = yup.object().shape({
  phaseName: yup.string().required('Phase name is required'),
  startDate: yup.date().required('Start date is required'),
  endDate: yup.date().required('End date is required'),
});
