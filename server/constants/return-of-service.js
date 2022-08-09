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
};

const rosFieldUpdate = {
  siteId: 'site',
  date: 'date',
  startDate: 'start-date',
};

module.exports = {
  rosPositionType,
  rosPositionTypeValues,
  rosEmploymentType,
  rosEmploymentTypeValues,
  rosError,
  rosFieldUpdate,
};
