const rosPositionType = {
  permanent: 'permanent',
  casual: 'casual',
};

const rosPositionTypeValues = Object.values(rosPositionType);

const rosEmploymentType = {
  fullTime: 'full-time',
  partTime: 'part-time',
};

const rosEmploymentTypeValues = Object.values(rosEmploymentType);

const rosError = {
  participantNotHired: 'participant-is-not-hired',
  participantNotFound: 'participant-not-found',
  fieldNotFound: 'ros-field-not-found',
  noSiteAttached: 'no-site-attached',
  noDate: 'no-date',
  noStartDate: 'no-start-date',
  noFieldsToUpdate: 'no-fields-to-update',
};

module.exports = {
  rosPositionType,
  rosPositionTypeValues,
  rosEmploymentType,
  rosEmploymentTypeValues,
  rosError,
};
