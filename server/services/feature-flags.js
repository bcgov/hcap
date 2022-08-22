const strToBoolean = (value) => value === 'true';

module.exports = {
  FEATURE_PHASE_ALLOCATION: strToBoolean(process.env.FEATURE_PHASE_ALLOCATION),
  DISABLE_EMPLOYER_FORM: true,
};
