import * as yup from 'yup';

export const EditSiteHiredParticipantSchema = yup.object().shape({
  // Ensure participant_id is included in the schema
  participant_id: yup
    .number()
    .required('Participant ID is required') // Adjust based on whether it's required
    .typeError('Participant ID must be a number'), // Type error if it's not a number

  // Ensure hiredDate is included in the schema
  hiredDate: yup
    .date()
    .required('Hire Date is required')
    .typeError('Invalid date format. Please use YYYY/MM/DD'), // Date format validation

  // Additional fields can be added here
  // For example, history and other fields from your data
});
