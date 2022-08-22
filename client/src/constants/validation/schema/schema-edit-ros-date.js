import * as yup from 'yup';

export const EditRosDateSchema = yup.object().shape({
  date: yup
    .date()
    .required('Please enter a new start date')
    .typeError('Invalid Date. Please follow the format: YYYY/MM/DD'),
});
