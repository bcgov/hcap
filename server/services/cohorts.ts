import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import { dbClient, collections } from '../db';
import { validate, CreateCohortSchema } from '../validation';
import { getPostHireStatusesForParticipant } from './post-hire-flow';
import { postHireStatuses, ParticipantStatus as ps } from '../constants';

// Setup dayjs utc
dayjs.extend(utc);

// Gets all cohorts with their associated list of participants
export const getCohorts = async () =>
  dbClient.db[collections.COHORTS]
    .join({
      participants: {
        relation: collections.COHORT_PARTICIPANTS,
        type: 'LEFT OUTER',
        on: {
          cohort_id: 'id',
        },
      },
    })
    .find();

export const getCohort = async (id) =>
  dbClient.db[collections.COHORTS].find({
    id,
  });

export const getCohortParticipants = async (cohortId) => {
  const cohortParticipants = await dbClient.db[collections.PARTICIPANTS]
    .join({
      cohortParticipantsJoin: {
        type: 'INNER',
        relation: collections.COHORT_PARTICIPANTS,
        on: {
          participant_id: 'id',
        },
      },
      postHireJoin: {
        type: 'LEFT OUTER',
        relation: collections.PARTICIPANT_POST_HIRE_STATUS,
        on: {
          participant_id: 'id',
        },
      },
      participantArchivedStatusJoin: {
        type: 'LEFT OUTER',
        relation: collections.PARTICIPANTS_STATUS,
        on: {
          participant_id: 'id',
          status: ps.ARCHIVED,
        },
      },
      participantHiredStatusJoin: {
        type: 'LEFT OUTER',
        relation: collections.PARTICIPANTS_STATUS,
        on: {
          participant_id: 'id',
          status: ps.HIRED,
        },
      },
      siteJoin: {
        type: 'LEFT OUTER',
        relation: collections.EMPLOYER_SITES,
        decomposeTo: 'object',
        on: { 'body.siteId': 'participantHiredStatusJoin.data.site' },
      },
    })
    .find({
      'cohortParticipantsJoin.cohort_id': cohortId,
    });

  return cohortParticipants;
};

/**
 * Filters cohort participants based on given user
 *
 * MOH: Don't filter participants
 * HA: Only return participants hired to requesting HA's region
 *
 * @param {*} cohortParticipants list of cohort participants
 * @param {*} user requesting user
 * @returns filtered list of participants
 */
export const filterCohortParticipantsForUser = (cohortParticipants, user) => {
  if (user.isMoH) {
    return cohortParticipants;
  }

  if (user.isHA) {
    // Remove participants hired outside of HA's region
    // participant.siteJoin is joined based on hired status' siteId
    return cohortParticipants.filter((participant) => {
      return user.regions.includes(participant.siteJoin?.body?.healthAuthority);
    });
  }

  return [];
};

/**
 * Calculates and appends fields to cohort objects based
 * on cohort data and participants list
 *
 * availableCohortSeats: number of seats available in the cohort
 * unsuccessfulParticipants: total participants with unsuccessful statuses
 *
 * @param {*} cohort cohort to calculate fields for
 * @param {*} participants cohort participant list, used in calculations
 * @returns
 */
export const getCohortWithCalculatedFields = (cohort, participants) => {
  const cohortWithCalculatedFields = { ...cohort };

  // Calculate available cohort seats
  cohortWithCalculatedFields.availableCohortSeats = cohort.cohort_size - participants.length;

  // Count cohort participants with unsuccessful statuses
  cohortWithCalculatedFields.unsuccessfulParticipants =
    participants.filter((participant) =>
      participant.postHireJoin?.find(
        (postHireStatus) =>
          postHireStatus.status === postHireStatuses.cohortUnsuccessful &&
          postHireStatus.is_current === true
      )
    )?.length || 0;

  return cohortWithCalculatedFields;
};

// Get all Cohorts associated with a specific PSI
export const getPSICohorts = async (psiID) => {
  let psiCohorts = await dbClient.db[collections.COHORTS]
    .join({
      participants: {
        relation: collections.COHORT_PARTICIPANTS,
        type: 'LEFT OUTER',
        on: {
          cohort_id: 'id',
        },
      },
      participantStatusJoin: {
        type: 'LEFT OUTER',
        relation: collections.PARTICIPANTS_STATUS,
        on: {
          participant_id: 'participants.participant_id',
        },
      },
    })
    .find({
      psi_id: psiID,
      // Additional condition to filter out the participants who don't have status assigned to them
      // This is used as a safeguard against legacy data
      // ref: https://github.com/bcgov/hcap/pull/847
      'participantStatusJoin.current !=': false,
      or: [
        { 'participantStatusJoin.status': [ps.HIRED, ps.ARCHIVED] },
        { 'participantStatusJoin.status': null },
      ],
    });

  psiCohorts = psiCohorts.map((cohort) => ({
    // deduplicate participants incases where they are reassigned to the same cohort
    ...cohort,
    participants: [
      ...new Map(
        cohort.participants.map((cohortParticipant) => [
          cohortParticipant.participant_id,
          cohortParticipant,
        ])
      ).values(),
    ],
  }));

  // calculate remaining cohort seats
  psiCohorts = psiCohorts.map((cohort) => ({
    ...cohort,
    remaining_seats: cohort.cohort_size - cohort.participants.length,
  }));

  return psiCohorts;
};

const mapDataToCohort = (cohort) => {
  const temp = {
    cohort_name: cohort.cohortName,
    start_date: cohort.startDate,
    end_date: cohort.endDate,
    cohort_size: parseInt(cohort.cohortSize, 10),
    psi_id: cohort.psiID,
  };
  // clean and remove undefined values
  const cleaned = Object.keys(temp).reduce(
    (acc, key) => (temp[key] ? { ...acc, [key]: temp[key] } : acc),
    {}
  );

  return cleaned;
};

export const makeCohort = async (cohortData) => {
  const cohort = mapDataToCohort(cohortData);
  await validate(CreateCohortSchema, cohort);
  const newCohort = await dbClient.db[collections.COHORTS].insert(cohort);
  return newCohort;
};

export const updateCohort = async (id, updateData) =>
  dbClient.db[collections.COHORTS].update(id, { ...mapDataToCohort(updateData) });

export const getAssignCohort = async ({ participantId }) => {
  const cohorts = await dbClient.db[collections.COHORTS]
    .join({
      cohortParticipant: {
        relation: collections.COHORT_PARTICIPANTS,
        type: 'INNER',
        on: {
          cohort_id: 'id',
          participant_id: participantId,
        },
      },
      psi: {
        relation: collections.POST_SECONDARY_INSTITUTIONS,
        type: 'LEFT OUTER',
        decomposeTo: 'object',
        on: {
          id: 'psi_id',
        },
      },
    })
    .find(
      {
        'cohortParticipant.is_current': true,
      },
      {
        order: [
          {
            field: `${collections.COHORT_PARTICIPANTS}.created_at`,
            direction: 'DESC',
            nulls: 'LAST',
          },
        ],
      }
    );

  return cohorts;
};

export const assignCohort = async ({ id, participantId }) => {
  // unassign pervious cohorts and update status
  await dbClient.db[collections.COHORT_PARTICIPANTS].update(
    { participant_id: participantId },
    {
      is_current: false,
    }
  );
  await dbClient.db[collections.PARTICIPANT_POST_HIRE_STATUS].update(
    { participant_id: participantId },
    {
      is_current: false,
    }
  );

  // assign a new cohort
  const newParticipantCohort = await dbClient.db[collections.COHORT_PARTICIPANTS].insert({
    cohort_id: id,
    participant_id: participantId,
  });
  return newParticipantCohort;
};

export const getCountOfAllocation = async ({ cohortId } = { cohortId: null }) =>
  dbClient.db[collections.COHORT_PARTICIPANTS].count({
    cohort_id: cohortId,
  });

export const findCohortByName = async ({ cohortName, psiName }) =>
  dbClient.db[collections.COHORTS]
    .join({
      psi: {
        relation: collections.POST_SECONDARY_INSTITUTIONS,
        type: 'INNER',
        decomposeTo: 'object',
        on: {
          id: 'psi_id',
          institute_name: psiName,
        },
      },
    })
    .find({
      cohort_name: cohortName,
    });

export const changeCohortParticipant = async (
  // WARN: This is not well typed! This should be fixed.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { cohortId, participantId, newCohortId, meta }: any = {
    cohortId: null,
    participantId: null,
    newCohortId: null,
    meta: {},
  }
) => {
  // Get existing participant cohort map
  const participantCohort = await dbClient.db[collections.COHORT_PARTICIPANTS].findOne({
    participant_id: participantId,
  });
  if (!participantCohort || !participantCohort.id) {
    throw new Error('Participant not found in cohort');
  }
  if (participantCohort.cohort_id !== cohortId) {
    throw new Error('Participant not in cohort');
  }
  // Get Graduation Status of Participant
  const participantPostHireStatuses =
    (await getPostHireStatusesForParticipant({ participantId })) || [];
  // Get cohort details for both
  const newCohort = await dbClient.db[collections.COHORTS].findOne({
    id: newCohortId,
  });
  if (!newCohort) {
    throw new Error('New Cohort not found');
  }

  // Update all data in transaction
  const resp = await dbClient.db.withTransaction(async (tnx) => {
    // Update Cohort Participant
    await tnx[collections.COHORT_PARTICIPANTS].update(participantCohort.id, {
      cohort_id: newCohortId,
    });
    // Update post-hire status
    let newPostHireStatuses;
    let isGraduated = false;
    if (participantPostHireStatuses.length > 0) {
      // Check participant is graduated or not
      isGraduated = participantPostHireStatuses.some(
        (postHireStatus) =>
          postHireStatus.status === postHireStatuses.postSecondaryEducationCompleted
      );
      // Delete all post-hire graduations statuses
      // Delete Post-Hire Status
      await tnx[collections.PARTICIPANT_POST_HIRE_STATUS].destroy({
        participant_id: participantId,
        status: postHireStatuses.postSecondaryEducationCompleted,
      });
    }
    // Now check New cohort is expired or not and participant is graduated or not
    if (isGraduated && newCohort.end_date && newCohort.end_date < new Date()) {
      // Update Post-Hire Status
      newPostHireStatuses = await tnx[collections.PARTICIPANT_POST_HIRE_STATUS].insert({
        participant_id: participantId,
        status: postHireStatuses.postSecondaryEducationCompleted,
        data: {
          graduationDate: dayjs.utc(newCohort.end_date).format('YYYY/MM/DD'),
        },
      });
    }

    // Update audit log
    let audit;
    if (Object.keys(meta).length > 0) {
      const { user, ...rest } = meta;
      audit = await tnx[collections.ADMIN_OPS_AUDIT].insert({
        user: user || 'system',
        data: {
          operationMetaData: rest,
          operationDetails: {
            operation: 'changeCohortParticipant',
            cohortId,
            participantId,
            newCohortId,
            participantPostHireStatuses,
            newPostHireStatuses,
          },
        },
      });
    }

    return {
      audit,
      newPostHireStatuses,
      oldPostHireStatus: participantPostHireStatuses || [],
    };
  });
  return resp;
};
