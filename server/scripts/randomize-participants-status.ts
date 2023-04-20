import dayjs from 'dayjs';

import {
  archiveReasonOptions,
  archiveStatusOptions,
  ParticipantStatus,
  postHireStatuses,
} from '../constants';
import { convertToCsv } from './services/participant-seed';

const NUM_LOOPS = 400;
const EMPLOYER_ID = 'ef963828-37db-44b4-ae5d-1e65b5a9b588';
const START_DATE = '2020-01-01';

// ids for participants whom already have added statuses
const usedIds = [];

// table data
let partStatusArray = [];
let cohortPartArray = [];
let partPostHireArray = [];
let returnOfServiceArray = [];

let participantId = 0;
let status = '';
let site = 0;
let isCurrent = false;
let incrementedDate = '';
let randomizeHiredSite: number;

// increment table ids
let psId = 1;
let cId = 1;
let pphId = 1;
let rosId = 1;

const partic_statuses = [
  'offer_made',
  'hired',
  'interviewing',
  'archived',
  'rejected',
  'peoi',
  'engaged',
  'unsuccessful_graduation',
];

const sites = [2222, 6666, 4444, 3333, 5151, 1111, 8888, 9999];
const rejectAckStatuses = ['withdrawn', 'position filled', 'not qualified', 'not responsive'];
const rejectedStatuses = ['hired by other', ...rejectAckStatuses];
const archivedType = ['duplicate', 'employmentEnded'];
const returnOfServiceStatuses = ['assigned-same-site', 'assigned-new-site'];
const positionType = ['casual', 'permanent'];
const employmentType = ['part-time', 'full-time'];

const randomize = (n: number, reject?: boolean) => {
  let value = 0;
  // prevent duplicate participant ids from being used
  // Sonarcloud complains about Math.random, ignoring as it's just being used for simple random numbers
  if (reject) {
    value = Math.floor(Math.random() * n); //NOSONAR
    while (usedIds.includes(value)) {
      value = Math.floor(Math.random() * n); //NOSONAR
    }
    usedIds.push(value);

    return value;
  }
  return Math.floor(Math.random() * n); //NOSONAR
};

// create a random date based off the previous statuses date
const randomizeDate = (d?: string) => {
  const start = dayjs(d || START_DATE);
  const daysToAdd = randomize(365);
  const addedDate = start.add(daysToAdd, 'day').format('YYYY/MM/DD');
  incrementedDate = addedDate;
  return addedDate;
};

/***
 * Generate random amount of participant statuses and all relating statuses
 */
export const randomizeParticipantStatus = async () => {
  for (let i = 0; i < NUM_LOOPS; i++) {
    participantId = randomize(499, true) + 1;
    const randomIndex = randomize(partic_statuses.length);
    status = partic_statuses[randomIndex];
    site = sites[randomize(sites.length)];

    randomizeDate();

    generateFullStatusEntry(status);
  }

  await convertToCsv(psId, partStatusArray, 'participants_status.csv');
  await convertToCsv(cId, cohortPartArray, 'cohort_participants.csv');
  await convertToCsv(pphId, partPostHireArray, 'participant_post_hire_status.csv');
  await convertToCsv(rosId, returnOfServiceArray, 'return_of_service_status.csv');
};

// loop through a status and add any related pre-statuses
const generateFullStatusEntry = (status: string) => {
  if (status === 'engaged') {
    isCurrent = true;
    partStatusArray.push(generateProspectingEntry());
    isCurrent = false;
  } else if (status === 'interviewing') {
    partStatusArray.push(generateProspectingEntry());
    isCurrent = true;
    partStatusArray.push(generateInterviewingEntry());
    isCurrent = false;
  } else if (status === 'offer_made') {
    partStatusArray.push(generateProspectingEntry());
    partStatusArray.push(generateInterviewingEntry());
    isCurrent = true;
    partStatusArray.push(generateOfferMadeEntry());
    isCurrent = false;
  } else if (status === 'hired') {
    randomizeHiredSite = sites[randomize(sites.length)];
    let chance = randomize(15);
    if (randomizeHiredSite === site) {
      generatePreHireStatuses();
      isCurrent = true;
      partStatusArray.push(generateHiredEntry());
      cohortPartArray.push(generateCohortPartEntry(16));
      isCurrent = false;
    } else if (chance === 1) {
      // assign unsuccessful graduation
      generatePreHireStatuses();
      isCurrent = true;
      partStatusArray.push(generateHiredEntry());
      cohortPartArray.push(generateCohortPartEntry());
      partPostHireArray.push(generatePartPostHireEntry(postHireStatuses.cohortUnsuccessful));
      isCurrent = false;
    } else if (chance % 2 === 0) {
      // assign re-assigned cohort
      generatePreHireStatuses();
      isCurrent = true;
      partStatusArray.push(generateHiredEntry());
      cohortPartArray.push(generateCohortPartEntry());
      partPostHireArray.push(generatePartPostHireEntry(postHireStatuses.cohortUnsuccessful));
      isCurrent = false;
      cohortPartArray.push(generateCohortPartEntry());
      partPostHireArray.push(
        generatePartPostHireEntry(postHireStatuses.postSecondaryEducationCompleted)
      );
    } else if (chance === 5) {
      generatePreHireStatuses();
      isCurrent = true;
      partStatusArray.push(generateHiredEntry());
      cohortPartArray.push(generateCohortPartEntry());
      partPostHireArray.push(
        generatePartPostHireEntry(postHireStatuses.postSecondaryEducationCompleted)
      );
      let secondChance = randomize(3);
      if (secondChance === 2) {
        // assign changed site after return of service
        isCurrent = false;
        returnOfServiceArray.push(generateReturnOfServiceEntry(returnOfServiceStatuses[0]));
        isCurrent = true;
        returnOfServiceArray.push(generateReturnOfServiceEntry(returnOfServiceStatuses[1]));
        isCurrent = false;
      } else {
        // assign return of service
        returnOfServiceArray.push(generateReturnOfServiceEntry(returnOfServiceStatuses[0]));
        isCurrent = false;
      }
    } else {
      // hired at different site
      partStatusArray.push(generateProspectingEntry());
      partStatusArray.push(generateInterviewingEntry());
      isCurrent = true;
      partStatusArray.push(generateOfferMadeEntry());
      partStatusArray.push(generateHiredEntry(randomizeHiredSite));
      isCurrent = false;
    }
  } else if (status === 'archived') {
    // archived AFTER hiring
    if (randomize(7) % 2 === 0) {
      const type = archivedType[randomize(archivedType.length)];
      generatePreHireStatuses();
      partStatusArray.push(generateHiredEntry());
      isCurrent = true;
      partStatusArray.push(generateArchivedEntry(type));
      if (type === 'employmentEnded') {
        partStatusArray.push(generateRejectedAcknowledgedEntry());
        partStatusArray.push(generateRejectedEntry());
      }
      isCurrent = false;
    } else if (randomize(10) === 5) {
      // generate completed HCAP requirements
      generatePreHireStatuses();
      partStatusArray.push(generateHiredEntry());
      isCurrent = true;
      partStatusArray.push(generateArchivedEntry());
      cohortPartArray.push(generateCohortPartEntry());
      partPostHireArray.push(
        generatePartPostHireEntry(postHireStatuses.postSecondaryEducationCompleted)
      );
      returnOfServiceArray.push(generateReturnOfServiceEntry(returnOfServiceStatuses[0]));
      isCurrent = false;
    } else {
      // archived BEFORE hiring
      generatePreHireStatuses();
      isCurrent = true;
      partStatusArray.push(generateRejectedAcknowledgedEntry());
      partStatusArray.push(generateRejectedEntry());
      isCurrent = false;
    }
  } else if (status === 'rejected') {
    randomizeHiredSite = sites[randomize(sites.length)];
    if (randomizeHiredSite === site) {
      // participant hired at same site
      generatePreHireStatuses();
      isCurrent = true;
      partStatusArray.push(generateHiredEntry());
      isCurrent = false;
    } else {
      // hired at different site, set reject and reject_ack
      generatePreHireStatuses();
      isCurrent = true;
      partStatusArray.push(generateHiredEntry(randomizeHiredSite));
      partStatusArray.push(generateRejectedAcknowledgedEntry());
      partStatusArray.push(generateRejectedEntry());
      isCurrent = false;
    }
  } else if (status === 'unsuccessful_graduation') {
    // create unsuccessful cohort
    generatePreHireStatuses();
    isCurrent = true;
    partStatusArray.push(generateHiredEntry());
    cohortPartArray.push(generateCohortPartEntry());
    partPostHireArray.push(generatePartPostHireEntry(postHireStatuses.cohortUnsuccessful));
    isCurrent = false;
  }
};

// generate 3 statuses required for a participant to get hired
const generatePreHireStatuses = () => {
  partStatusArray.push(generateProspectingEntry());
  partStatusArray.push(generateInterviewingEntry());
  partStatusArray.push(generateOfferMadeEntry());
};

/**
 * functions for generating each status and their expected data body
 */
const generateProspectingEntry = () => {
  return {
    employer_id: EMPLOYER_ID,
    participant_id: participantId,
    status: ParticipantStatus.PROSPECTING,
    current: isCurrent,
    data: JSON.stringify({ site }),
  };
};

const generateInterviewingEntry = () => {
  return {
    employer_id: EMPLOYER_ID,
    participant_id: participantId,
    status: ParticipantStatus.INTERVIEWING,
    current: isCurrent,
    data: JSON.stringify({ site, contacted_at: randomizeDate(incrementedDate) }),
  };
};

const generateOfferMadeEntry = (s?: number) => {
  return {
    employer_id: EMPLOYER_ID,
    participant_id: participantId,
    status: ParticipantStatus.OFFER_MADE,
    current: isCurrent,
    data: JSON.stringify({ site: s || site, contacted_at: randomizeDate(incrementedDate) }),
  };
};

const generateHiredEntry = (s?: number) => {
  return {
    employer_id: EMPLOYER_ID,
    participant_id: participantId,
    status: ParticipantStatus.HIRED,
    current: isCurrent,
    data: JSON.stringify({
      site: s || site,
      hiredDate: randomizeDate(incrementedDate),
      startDate: randomizeDate(incrementedDate),
      positionType: '',
      positionTitle: '',
    }),
  };
};

const generateRejectedEntry = () => {
  return {
    employer_id: EMPLOYER_ID,
    participant_id: participantId,
    status: ParticipantStatus.REJECTED,
    current: isCurrent,
    data: JSON.stringify({
      site,
      final_status: rejectedStatuses[randomize(rejectedStatuses.length)],
    }),
  };
};

const generateRejectedAcknowledgedEntry = (s?: number) => {
  return {
    employer_id: EMPLOYER_ID,
    participant_id: participantId,
    status: ParticipantStatus.REJECT_ACKNOWLEDGEMENT,
    current: isCurrent,
    data: JSON.stringify({
      site: s || site,
      refStatus: partStatusArray[partStatusArray.length - 1].status,
      refStatusId: partStatusArray.length,
      final_status: rejectAckStatuses[randomize(rejectAckStatuses.length)],
    }),
  };
};

const generateArchivedEntry = (t?: string) => {
  const willRehire = randomize(2) % 2 === 0;
  const type = t || archivedType[randomize(archivedType.length)];
  const isDuplicateType = type === 'duplicate';
  return {
    employer_id: EMPLOYER_ID,
    participant_id: participantId,
    status: ParticipantStatus.ARCHIVED,
    current: isCurrent,
    data: JSON.stringify({
      type,
      reason: !isDuplicateType ? archiveReasonOptions[randomize(archiveReasonOptions.length)] : '',
      rehire: willRehire ? 'Yes' : 'No',
      status: !isDuplicateType ? archiveStatusOptions[randomize(archiveStatusOptions.length)] : '',
      endDate: randomizeDate(incrementedDate),
      confirmed: 'true',
    }),
  };
};

const generateCohortPartEntry = (c?: number) => {
  if (!c) {
    c = randomize(60) + 1;
    while (c === 16) {
      c = randomize(60) + 1;
    }
  }
  return {
    cohort_id: c,
    participant_id: participantId,
    is_current: isCurrent,
  };
};

const generatePartPostHireEntry = (s?: string) => {
  let rowData: {};

  if (!s || s === postHireStatuses.postSecondaryEducationCompleted) {
    rowData = {
      graduationDate: randomizeDate(incrementedDate),
    };
  } else if (!s || s === postHireStatuses.cohortUnsuccessful) {
    rowData = {
      unsuccessfulCohortDate: randomizeDate(incrementedDate),
    };
  }

  return {
    participant_id: participantId,
    status: s || postHireStatuses.postSecondaryEducationCompleted,
    data: JSON.stringify(rowData),
    is_current: isCurrent,
  };
};

const generateReturnOfServiceEntry = (s?: string) => {
  const rosStatus = returnOfServiceStatuses[randomize(returnOfServiceStatuses.length)];
  const isSameSite = (s || rosStatus) === 'assigned-same-site' ? true : false;

  return {
    participant_id: participantId,
    status: s || returnOfServiceStatuses[1],
    data: JSON.stringify({
      sameSite: isSameSite,
      date: randomizeDate(incrementedDate),
      positionType: positionType[randomize(positionType.length)],
      employmentType: employmentType[randomize(employmentType.length)],
    }),
    site_id: sites.indexOf(site) + 1,
    is_current: isCurrent,
  };
};

(async () => {
  console.log('---- Running');
  console.log('------ Randomizing data');
  await randomizeParticipantStatus();
  console.log('---- Finished');
})();
