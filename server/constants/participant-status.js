const participantStatus = {
  OPEN: 'open',
  PROSPECTING: 'prospecting',
  INTERVIEWING: 'interviewing',
  OFFER_MADE: 'offer_made',
  ARCHIVED: 'archived',
  REJECTED: 'rejected',
  HIRED: 'hired',
  PENDING_ACKNOWLEDGEMENT: 'pending_acknowledgement',
  ALREADY_HIRED: 'already_hired',
  INVALID_STATUS_TRANSITION: 'invalid_status_transition',
  INVALID_ARCHIVE: 'invalid_archive',
  INVALID_STATUS: 'invalid_status',
  UNAVAILABLE: 'unavailable',
  ROS: 'ros',
  REJECT_ACKNOWLEDGEMENT: 'reject_ack',
};

module.exports = {
  participantStatus,
};
