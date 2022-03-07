const helpers = require('./helpers');
const employer = require('./employer');
const participant = require('./participant');
const psiCohort = require('./psi-cohort');
const employerOperation = require('./employer-operation');
const participantUser = require('./participant-user');
const externalParticipant = require('./external-participant');

const validate = async (schema, data) => schema.validate(data, { strict: true });

module.exports = {
  ...helpers,
  ...participant,
  ...employer,
  ...psiCohort,
  ...employerOperation,
  ...participantUser,
  ...externalParticipant,
  validate,
};
