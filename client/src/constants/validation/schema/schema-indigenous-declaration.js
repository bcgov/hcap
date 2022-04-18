import * as yup from 'yup';
import { indigenousIdentities } from '../../../components/modal-forms/IndigenousDeclarationForm';

export const IndigenousDeclarationSchema = yup.object().shape({
  isIndigenous: yup.boolean().nullable(),
  [indigenousIdentities.FIRST_NATIONS]: yup.boolean(),
  [indigenousIdentities.INUIT]: yup.boolean(),
  [indigenousIdentities.METIS]: yup.boolean(),
  [indigenousIdentities.OTHER]: yup.boolean(),
  [indigenousIdentities.UNKNOWN]: yup.boolean(),
});
