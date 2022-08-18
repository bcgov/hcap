/* eslint-disable no-console */
// Usage: node scripts/cli.js --service=changeCohort --participantId=23 --newCohort="Temp555" --newPSI="Freshworks Tech" --oldCohort="Laba2.2022" --oldPSI="Freshworks Tech"
const { optionValidator } = require('./common');
const { changeCohortParticipant, findCohortByName } = require('../../services/cohorts');
const { getParticipantByID } = require('../../services/participants');

const serviceMethod = async (options) => {
  const { participantId, newCohort, newPSI, oldCohort, oldPSI } = options;
  const [success, message, usageMessage] = optionValidator({
    options,
    keys: ['participantId', 'newCohort', 'newPSI', 'oldCohort', 'oldPSI'],
  });
  if (!success) {
    return { success, message, usageMessage };
  }
  // Info Logging
  console.log(
    `Changing participant ${participantId} from cohort ${oldCohort}/${oldPSI} to cohort ${newCohort}/${newPSI}`
  );
  // Fetch oldCohort id
  const [oldCohortDbObj] = await findCohortByName({ cohortName: oldCohort, psiName: oldPSI });
  if (!oldCohortDbObj) {
    return { success: false, message: `Error: Cohort '${oldCohort}' not found`, usageMessage: '' };
  }
  console.log(`Found old cohort ${oldCohort}/${oldPSI} with id ${oldCohortDbObj.id}`);
  const [newCohortDbObj] = await findCohortByName({ cohortName: newCohort, psiName: newPSI });
  if (!newCohortDbObj) {
    return { success: false, message: `Error: Cohort '${newCohort}' not found`, usageMessage: '' };
  }
  console.log(`Found new cohort ${newCohort}/${newPSI} with id ${newCohortDbObj.id}`);

  const participant = await getParticipantByID(participantId);
  if (!participant) {
    return {
      success: false,
      message: `Error: Participant with id ${participantId} not found`,
      usageMessage: '',
    };
  }
  console.log(`Found participant with ${participantId}`);

  try {
    await changeCohortParticipant({
      cohortId: oldCohortDbObj.id,
      participantId,
      newCohortId: newCohortDbObj.id,
      meta: {
        user: options.user || 'system',
        operation: 'changeCohortParticipant',
      },
    });
    return { success: true, message: 'Success', usageMessage: '' };
  } catch (error) {
    return { success: false, message: `Error: ${error}`, usageMessage: '' };
  }
};

module.exports = {
  changeCohort: serviceMethod,
};
