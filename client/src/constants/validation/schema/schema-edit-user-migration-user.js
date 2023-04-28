import * as yup from 'yup';
import { errorMessage } from '../functions';

export const EditUserMigrationUserFormSchema = yup.object().shape({
  username: yup.string().required(errorMessage),
  emailAddress: yup.string().required(errorMessage).email('Invalid email address'),
});
