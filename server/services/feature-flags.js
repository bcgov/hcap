const strToBoolean = (value) => value === 'true';

module.exports = {
  EXAMPLE_USAGE: strToBoolean(process.env.EXAMPLE_USAGE) || false,
  DISABLE_EMPLOYER_FORM: true,
};
