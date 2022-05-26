const healthRegions = ['Interior', 'Fraser', 'Vancouver Coastal', 'Vancouver Island', 'Northern'];

const foundOutReasons = [
  'Friend(s)',
  'WorkBC',
  'Government announcement',
  'Colleague(s)',
  'Job posting through Health Authority',
  'Job posting with employer',
  'Web search',
  'Social media',
  'Other',
];

const orderDirections = ['desc', 'asc'];

const sortFields = [
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
  'engagedBy',
];

const roles = [
  'Registered Nurse',
  'Licensed Practical Nurse',
  'Health Care Assistant',
  'Food Services Worker',
  'Housekeeping',
  'COVID-19 IPC Response',
  'Site Administrative Staff',
];

const siteTypes = ['Long-term care', 'Assisted living', 'Both', 'Other', ''];

const userRoles = ['health_authority', 'employer', 'ministry_of_health'];

const participantStatuses = [
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

const postHireStatuses = {
  orientationCompleted: 'orientation_completed',
  postSecondaryEducationUnderway: 'post_secondary_education_underway',
  postSecondaryEducationCompleted: 'post_secondary_education_completed',
  cohortUnsuccessful: 'cohort_unsuccessful',
};

const postHireStatusesValues = Object.values(postHireStatuses).sort();

const archiveReasonOptions = [
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

const archiveStatusOptions = [
  'Not begun orientation or training',
  'Provincial orientation curriculum complete',
  'Post secondary education underway',
  'Completed post secondary education',
];

const validIndigenousIdentities = ['first-nations', 'inuit', 'metis', 'other', 'unknown'];

const ROSUnderwayStatus = 'Return of service underway';
const ROSCompleteStatus = 'Return of service complete';
const ROSCompletedType = { value: 'rosComplete', label: 'Return of service completed' };
const SuccessfulROSReason = 'Completed all HCAP requirements';

module.exports = {
  healthRegions,
  foundOutReasons,
  sortFields,
  siteTypes,
  userRoles,
  participantStatuses,
  postHireStatuses,
  postHireStatusesValues,
  archiveReasonOptions,
  archiveStatusOptions,
  roles,
  orderDirections,
  validIndigenousIdentities,
  ROSUnderwayStatus,
  ROSCompleteStatus,
  ROSCompletedType,
  SuccessfulROSReason,
};
