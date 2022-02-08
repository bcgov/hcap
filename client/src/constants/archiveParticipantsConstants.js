export const FailedCohortReason = 'Unsuccessful cohort, does not wish to continue in HCAP';

export const PSIEducationUnderwayStatus = 'Post secondary education underway';

export const archiveReasonOptions = [
  'No longer interested in HCA/HCSW role',
  'No longer interested in a career in health care',
  'Terminated by employer',
  'Personal health concerns',
  'Moving out of province',
  'Moved to different profession',
  'Delay initiating education',
  'Did not meet program requirements',
  'Issue with mandatory vaccination',
  FailedCohortReason,
  'Other',
];

export const archiveStatusOptions = [
  'Not begun orientation or training',
  'Provincial orientation curriculum complete',
  PSIEducationUnderwayStatus,
  'Completed post secondary education',
];

export const archiveTypeOptions = [
  { value: '', label: '' },
  { value: 'employmentEnded', label: 'Employment ended' },
  { value: 'duplicate', label: 'Duplicate' },
];

export const minDateString = '1899/12/31';
export const maxDateString = '2099/12/31';
