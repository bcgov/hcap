export const ROWS_PER_PAGE_OPTIONS = [5, 10, 25];

export const COLUMNS = [
  { id: 'lastName', name: 'Last Name', sortable: false },
  { id: 'firstName', name: 'First Name', sortable: false },
  { id: 'siteName', name: 'Site Name', sortable: false },
  { id: 'graduationStatus', name: 'Graduation Status', sortable: false },
  { id: 'removeButton', name: 'Action', sortable: false },
  { id: 'transferButton', name: 'Transfer', sortable: false },
];

export const DIALOG_TITLES = {
  ADD_PARTICIPANT: 'Add Participants to Cohort',
  CONFIRM_REMOVAL: 'Confirm Removal',
};

export const ALERT_MESSAGES = {
  NO_SEATS: 'No available seats in the cohort. Cannot add participants.',
  COHORT_ENDED: 'The cohort end date has passed. Cannot add participants.',
  NO_PARTICIPANTS: 'No Participants in this Cohort',
  BULK_GRADUATION:
    'Bulk Graduation is only available for participants with no graduation status. Please deselect participants who have had a successful or unsuccessful graduation.',
  HIRED_OUTSIDE: 'Participants hired outside your region will not appear in this list',
};

export const BUTTON_TEXTS = {
  ADD_PARTICIPANT: 'Add Participant',
  BULK_GRADUATE: 'Bulk Graduate',
  REMOVE: 'Remove',
  TRANSFER: 'Transfer',
  CANCEL: 'Cancel',
  CONFIRM: 'Confirm',
};
