export const healthRegions = [
  'Interior',
  'Fraser',
  'Vancouver Coastal',
  'Vancouver Island',
  'Northern',
];

export const foundOutReasons = [
  'Friend(s) or family',
  'WorkBC',
  'Government announcement',
  'Colleague(s)',
  'Job posting through Health Authority',
  'Job posting with employer',
  'Web search',
  'Social media',
  'Other',
];

export const orderDirections = ['desc', 'asc'];

export const sortFields = [
  'id',
  'firstName',
  'lastName',
  'postalCodeFsa',
  'preferredLocation',
  'phoneNumber',
  'emailAddress',
  'nonHCAP',
  'interested',
  'crcClear',
  'status',
  'callbackStatus',
  'statusInfo',
  'userUpdatedAt',
  'siteName',
  'distance',
  'isIndigenous',
  'postHireStatuses',
  'rosStartDate',
  'rosSiteName',
  'employerName',
  'lastEngagedBy',
  'lastEngagedDate',
];

export const roles = [
  'Registered Nurse',
  'Licensed Practical Nurse',
  'Health Care Assistant',
  'Food Services Worker',
  'Housekeeping',
  'COVID-19 IPC Response',
  'Site Administrative Staff',
];

export const siteTypes = ['Long-term care', 'Assisted living', 'Both', 'Other', ''];

export const siteTypesOptions = [
  'Health Authority',
  'Home Health',
  'Acute',
  'Indigenous',
  'Private',
  'Affiliate',
];

export const participantStatuses = [
  'open',
  'prospecting',
  'interviewing',
  'offer_made',
  'hired',
  'rejected',
  'unavailable',
  'archived',
  'pending_acknowledgement',
  'ros',
  'rosComplete',
];

// Not sure why eslint thinks this is a shadow - it isn't.
// eslint-disable-next-line no-shadow
export enum postHireStatuses {
  orientationCompleted = 'orientation_completed',
  postSecondaryEducationUnderway = 'post_secondary_education_underway',
  postSecondaryEducationCompleted = 'post_secondary_education_completed',
  cohortUnsuccessful = 'cohort_unsuccessful',
}

export const postHireStatusesValues = Object.values(postHireStatuses).sort();

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
  'Unsuccessful cohort, does not wish to continue in HCAP',
  'Other',
];

export const archiveStatusOptions = [
  'Not begun orientation or training',
  'Provincial orientation curriculum complete',
  'Post secondary education underway',
  'Completed post secondary education',
];

export const validIndigenousIdentities = ['first-nations', 'inuit', 'metis', 'other', 'unknown'];

export const ROSUnderwayStatus = 'Return of service underway';
export const ROSCompleteStatus = 'Return of service complete';
export const ROSCompletedType = { value: 'rosComplete', label: 'Return of service completed' };
export const SuccessfulROSReason = 'Completed all HCAP requirements';
