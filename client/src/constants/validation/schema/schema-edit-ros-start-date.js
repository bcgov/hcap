import * as yup from 'yup';

export const EditRosStartDateSchema = yup.object().shape({
  date: yup
    .date()
    .required('Please enter the start date at a new site')
    .typeError('Invalid Date. Please follow the format: YYYY/MM/DD'),
});
