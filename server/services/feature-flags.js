const strToBoolean = (value) => value === 'true';

module.exports = {
  FEATURE_MULTI_ORG_PROSPECTING: strToBoolean(process.env.FEATURE_MULTI_ORG_PROSPECTING) || true,
};
