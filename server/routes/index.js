const participantUserRoute = require('./participant-user');
const {
  participantRouter,
  participantsRouter,
  newHiredParticipantRouter,
  employerActionsRouter,
} = require('./participant');

module.exports = {
  participantUserRoute,
  participantRouter,
  participantsRouter,
  newHiredParticipantRouter,
  employerActionsRouter,
};
