import * as yup from 'yup';

export const LoginSchema = yup
  .object()
  .noUnknown()
  .shape({
    username: yup.string().required('Username is required'),
    password: yup.string().required('Password is required'),
  });
