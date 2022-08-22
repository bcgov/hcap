const helpers = require('./helpers');
const employer = require('./employer');
const phase = require('./phase');
const participant = require('./participant');
const psiCohort = require('./psi-cohort');
const employerOperation = require('./employer-operation');
const participantUser = require('./participant-user');
const externalParticipant = require('./external-participant');
const returnOfService = require('./return-of-service');
const bulkEngage = require('./bulk-engage');

const validate = async (schema, data) => schema.validate(data, { strict: true });

module.exports = {
  ...helpers,
  ...participant,
  ...employer,
  ...phase,
  ...psiCohort,
  ...employerOperation,
  ...participantUser,
  ...externalParticipant,
  ...returnOfService,
  ...bulkEngage,
  validate,
};
