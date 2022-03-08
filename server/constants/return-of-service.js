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
  participantNotHired: 'Participant-is-not-hired',
  noSiteAttached: 'No-site-attached',
};

module.exports = {
  rosPositionType,
  rosPositionTypeValues,
  rosEmploymentType,
  rosEmploymentTypeValues,
  rosError,
};
