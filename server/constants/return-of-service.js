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
  noSiteAttached: 'no-site-attached',
};

module.exports = {
  rosPositionType,
  rosPositionTypeValues,
  rosEmploymentType,
  rosEmploymentTypeValues,
  rosError,
};
