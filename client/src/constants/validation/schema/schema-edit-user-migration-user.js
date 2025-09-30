import * as yup from 'yup';
import { errorMessage } from '../functions';

export const EditUserMigrationUserFormSchema = yup.object().shape({
  username: yup.string().required(errorMessage),
  emailAddress: yup
    .string()
    .required(errorMessage)
    .matches(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      'Please enter a valid email address with a proper domain (e.g., user@example.com)',
    ),
});
