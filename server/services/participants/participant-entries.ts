import dayjs from 'dayjs';
import { dbClient, collections } from '../../db';
import { getAssignCohort } from '../cohorts';
import { createPostHireStatus, getPostHireStatusesForParticipant } from '../post-hire-flow';
import logger from '../../logger';
import type {
  EmailAddressFilter,
  IsIndigenousFilter,
  LastNameFilter,
  Pagination,
  PostalCodeFsaFilter,
  ProgramFilter,
  idFilter,
} from '../participants-helper';
import type { HcapUserInfo } from '../../keycloak';
import { ParticipantStatus as ps, postHireStatuses } from '../../constants';
import { isPrivateEmployerOrMHSUEmployerOrHA, ParticipantsFinder } from '../participants-helper';

export const makeParticipant = async (participantData) => {
  const res = await dbClient.db.saveDoc(collections.PARTICIPANTS, participantData);
  return res;
};

export const getParticipantByID = async (id) => {
  const participant = await dbClient.db[collections.PARTICIPANTS].findDoc({
    id,
  });
  return participant;
};

export const getParticipantByIdWithStatus = async ({ id, userId }) =>
  dbClient.db[collections.PARTICIPANTS]
    .join({
      currentStatuses: {
        type: 'LEFT OUTER',
        relation: collections.PARTICIPANTS_STATUS,
        on: {
          participant_id: 'id',
          current: true,
        },
      },
      user: {
        type: 'INNER',
        relation: collections.USER_PARTICIPANT_MAP,
        decomposeTo: 'object',
        on: {
          participant_id: 'id',
          user_id: userId,
        },
      },
    })
    .find({ id, 'user.user_id': userId });

export const deleteParticipant = async ({ email }) => {
  await dbClient.db.withTransaction(async (tnx) => {
    // Delete entry from participant-user-map
    await tnx.query(
      `
        DELETE FROM ${collections.USER_PARTICIPANT_MAP} 
        WHERE participant_id IN
        ( SELECT id FROM ${collections.PARTICIPANTS} 
          WHERE LOWER(body->>'emailAddress') = LOWER($1)
        );`,
      [email]
    );
    // Delete actual entry
    await tnx[collections.PARTICIPANTS].destroy({
      'body.emailAddress': email,
    });
  });
};

export const updateParticipant = async (participantInfo) => {
  try {
    // The below reduce function unpacks the most recent changes in the history
    // and builds them into an object to be used for the update request
    const changes = participantInfo.history[0].changes.reduce(
      (acc, change) => {
        const { field, to } = change;
        return { ...acc, [field]: to };
      },
      { history: participantInfo.history || [], userUpdatedAt: new Date().toJSON() }
    );
    if (changes.interested === 'withdrawn') {
      const cohort = await getAssignCohort({ participantId: participantInfo.id });
      // Get All existing status
      const statuses = await getPostHireStatusesForParticipant({
        participantId: participantInfo.id,
      });
      const graduationStatuses = statuses.filter(
        (item) =>
          item.status === postHireStatuses.postSecondaryEducationCompleted ||
          item.status === postHireStatuses.cohortUnsuccessful
      );
      // ensure that a participant has a cohort before adding post hire status
      if (cohort && cohort.length > 0 && graduationStatuses.length === 0) {
        await createPostHireStatus({
          participantId: participantInfo.id,
          status: postHireStatuses.cohortUnsuccessful,
          data: {
            unsuccessfulCohortDate: dayjs().format('YYYY/MM/DD'),
          },
        });
      }
    }
    const participant = await dbClient.db[collections.PARTICIPANTS].updateDoc(
      {
        id: participantInfo.id,
      },
      changes
    );

    return participant;
  } catch (error) {
    logger.error(`updateParticipant: fail to update participant: ${error}`);
    throw error;
  }
};

export const setParticipantLastUpdated = async (id) => {
  // Find participants
  let [participant] = await getParticipantByID(id);
  // Don't change status if participant is withdrawn
  if (participant.interested !== 'withdrawn') {
    // Only change history if the interested column isn't yes
    if (participant.interested !== 'yes') {
      if (participant.history) {
        participant.history.push({
          to: 'yes',
          from: participant.interested,
          field: 'interested',
          timestamp: new Date(),
        });
      } else {
        participant.history = [
          {
            to: 'yes',
            from: participant.interested,
            field: 'interested',
            timestamp: new Date(),
          },
        ];
      }
    }
    participant = await dbClient.db[collections.PARTICIPANTS].updateDoc(
      {
        id,
      },
      {
        interested: 'yes',
        history: participant.history,
        userUpdatedAt: new Date().toJSON(),
      }
    );
  }
};

export const withdrawParticipant = async (participantInfo) => {
  const participant = { ...participantInfo };
  const newHistory = {
    timestamp: new Date(),
    changes: [],
  };
  newHistory.changes.push({
    field: 'interested',
    from: participant.interested || 'yes',
    to: 'withdrawn',
  });
  participant.history = participant.history ? [newHistory, ...participant.history] : [newHistory];
  // eslint-disable-next-line no-use-before-define
  return updateParticipant(participant);
};

export const getParticipants = async (
  user?: HcapUserInfo,
  pagination?: Pagination,
  sortField?: string,
  regionFilter?: string,
  idFilter?: idFilter,
  /** FSA (first half of a postal code) to filter by */
  fsaFilter?: PostalCodeFsaFilter,
  lastNameFilter?: LastNameFilter,
  emailFilter?: EmailAddressFilter,
  siteSelector?,
  statusFilters?: string[],
  isIndigenousFilter?: IsIndigenousFilter,
  programFilter?: ProgramFilter
) => {
  // Get user ids
  const participantsFinder = new ParticipantsFinder(dbClient, user);
  const interestFilter =
    isPrivateEmployerOrMHSUEmployerOrHA(user) && statusFilters?.includes('open');
  let participants = await participantsFinder
    .filterRegion(regionFilter)
    .filterProgram(programFilter)
    .filterParticipantFields({
      id: idFilter,
      postalCodeFsa: fsaFilter,
      lastName: lastNameFilter,
      emailAddress: emailFilter,
      interestFilter: interestFilter && ['no', 'withdrawn'],
      isIndigenousFilter,
    })
    .filterExternalFields({
      statusFilters,
      siteIdDistance: siteSelector,
    })
    .paginate(pagination, sortField)
    .run();
  const { table, criteria } = participantsFinder;
  const paginationData = pagination && {
    offset: (pagination.offset ? Number(pagination.offset) : 0) + participants.length,
    total: Number(await table.count(criteria || {})),
  };

  // HCAP:1030: Get participants post-hire statuses
  participants = await Promise.all(
    participants.map(async (participant) => {
      const statuses = await getPostHireStatusesForParticipant({ participantId: participant.id });
      return {
        ...participant,
        postHireStatuses: statuses || [],
      };
    })
  );

  if (user.isSuperUser || user.isMoH) {
    return {
      data: participants.map((item) => {
        // Only return relevant fields
        let returnStatus = 'Pending';
        const progressStats = {
          prospecting: 0,
          interviewing: 0,
          offer_made: 0,
          hired: 0,
          total: 0,
        };

        if (item.interested === 'no') returnStatus = 'Withdrawn';
        if (item.interested === 'yes') returnStatus = 'Available';

        item.statusInfos.forEach((entry) => {
          progressStats[entry.status] += 1;
          progressStats.total += 1;
        });

        const { total, hired } = progressStats;
        if (total > 0)
          returnStatus = total === 1 ? 'In Progress' : `In Progress (${progressStats.total})`;
        if (hired) returnStatus = 'Hired';
        return {
          id: item.id,
          program: item.program,
          educationalRequirements: item.educationalRequirements,
          firstName: item.firstName,
          lastName: item.lastName,
          postalCodeFsa: item.postalCodeFsa,
          indigenous: item.indigenous,
          driverLicense: item.driverLicense,
          experienceWithMentalHealthOrSubstanceUse: item.experienceWithMentalHealthOrSubstanceUse,
          preferredLocation: item.preferredLocation,
          currentOrMostRecentIndustry: item.currentOrMostRecentIndustry,
          roleInvolvesMentalHealthOrSubstanceUse: item.roleInvolvesMentalHealthOrSubstanceUse,
          nonHCAP: item.nonHCAP,
          interested: item.interested,
          crcClear: item.crcClear,
          callbackStatus: item.callbackStatus,
          statusInfo: returnStatus,
          userUpdatedAt: item.userUpdatedAt,
          distance: item.distance,
          progressStats,
          postHireStatuses: item.postHireStatuses || [],
          rosStatuses: item.rosStatuses || [],
        };
      }),
      ...(pagination && { pagination: paginationData }),
    };
  }

  // Returned participants for employers
  return {
    data: participants.map((item) => {
      let participant = {
        id: item.id,
        program: item.program,
        educationalRequirements: item.educationalRequirements,
        firstName: item.firstName,
        lastName: item.lastName,
        postalCodeFsa: item.postalCodeFsa,
        indigenous: item.indigenous,
        driverLicense: item.driverLicense,
        experienceWithMentalHealthOrSubstanceUse: item.experienceWithMentalHealthOrSubstanceUse,
        preferredLocation: item.preferredLocation,
        currentOrMostRecentIndustry: item.currentOrMostRecentIndustry,
        roleInvolvesMentalHealthOrSubstanceUse: item.roleInvolvesMentalHealthOrSubstanceUse,
        nonHCAP: item.nonHCAP,
        userUpdatedAt: item.userUpdatedAt,
        callbackStatus: item.callbackStatus,
        distance: item.distance,
        postHireStatuses: item.postHireStatuses || [],
        rosStatuses: item.rosStatuses || [],
        statusInfos: undefined, // This gets set later. Should probably get stronger typing.
        phoneNumber: undefined,
        emailAddress: undefined,
      };

      // Get hired status
      const hiredStatus = item.statusInfos?.find((statusInfo) => statusInfo.status === ps.HIRED);
      const hiredForAssociatedSites = hiredStatus && user.sites.includes(hiredStatus?.data.site);

      // Current Status
      const currentStatusInfo = item.statusInfos[0] || {};
      const currentStatusInProgress = ![ps.HIRED, ps.ARCHIVED].includes(currentStatusInfo.status);
      // The participant is hired in a site which is not associated with user
      const hiredByOtherOrg = hiredStatus && !hiredForAssociatedSites;
      // The participant is hired by some other user but site associated by user
      const hiredBySomeoneInSameOrgStatus =
        hiredStatus &&
        hiredForAssociatedSites &&
        hiredStatus.employerId !== user.id &&
        currentStatusInProgress;
      // Hired by same user but different site
      const hiredForOtherSite =
        hiredStatus &&
        hiredForAssociatedSites &&
        currentStatusInfo.data?.site !== hiredStatus.data.site &&
        ![ps.HIRED, ps.ARCHIVED].includes(currentStatusInfo.status) &&
        hiredStatus.employerId === user.id;

      // Archived by org
      const archivedByOrgStatus = item.statusInfos?.find(
        (statusInfo) => statusInfo.status === ps.ARCHIVED && statusInfo.employerId !== user.id
      );

      // Handling withdrawn and already hired, putting withdrawn as higher priority
      let computedStatus;
      if (item.interested === 'withdrawn' || item.interested === 'no') {
        computedStatus = {
          createdAt: new Date(),
          status: 'withdrawn',
        };
      } else if (hiredByOtherOrg) {
        computedStatus = {
          createdAt: hiredStatus.createdAt,
          status: 'already_hired',
        };
      } else if (hiredBySomeoneInSameOrgStatus || hiredForOtherSite) {
        computedStatus = {
          createdAt: hiredStatus.createdAt,
          status: 'hired_by_peer',
        };
      } else if (archivedByOrgStatus) {
        computedStatus = archivedByOrgStatus;
      }

      if (computedStatus) {
        participant.statusInfos = participant.statusInfos
          ? [...participant.statusInfos, computedStatus]
          : [computedStatus];
      }

      const statusInfos = item.statusInfos?.find(
        (statusInfo) =>
          statusInfo.employerId === user.id ||
          (statusInfo.data && user.sites?.includes(statusInfo.data.site))
      );

      if (statusInfos) {
        if (!participant.statusInfos) participant.statusInfos = [];

        participant.statusInfos.unshift(statusInfos);
        const showContactInfo = participant.statusInfos.find((statusInfo) =>
          [ps.PROSPECTING, ps.INTERVIEWING, ps.OFFER_MADE, ps.HIRED].includes(statusInfo.status)
        );
        if (showContactInfo && !hiredByOtherOrg) {
          participant = {
            ...participant,
            phoneNumber: item.phoneNumber,
            emailAddress: item.emailAddress,
          };
        }
      }

      return participant;
    }),
    ...(pagination && { pagination: paginationData }),
  };
};
