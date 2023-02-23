const strToBoolean = (value) => value === 'true';
export default {
  FEATURE_PHASE_ALLOCATION: strToBoolean(process.env.FEATURE_PHASE_ALLOCATION),
  FEATURE_EMPLOYER_FORM: false,
};
