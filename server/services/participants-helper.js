/* eslint-disable max-classes-per-file */
const { collections, views } = require('../db');
const { userRegionQuery } = require('./user.js');
const { participantStatus } = require('../constants');
const logger = require('../logger.js');

const {
  OPEN: open,
  PROSPECTING: prospecting,
  INTERVIEWING: interviewing,
  OFFER_MADE: offerMade,
  HIRED: hired,
  ARCHIVED: archived,
  REJECTED: rejected,
  PENDING_ACKNOWLEDGEMENT: pendingAcknowledgement,
  ROS: ros,
  REJECT_ACKNOWLEDGEMENT: rejectAcknowledgement,
} = participantStatus;

/**
 * @description Flattens the participants array into a single array based on statuses
 * @param {Array<any>} participants
 * @returns {Array<any>}
 */
const flattenParticipants = (participants) => {
  const flattenedParticipantList = [];
  participants.forEach((participant) => {
    const { employerSpecificJoin = [], ...participantInfo } = participant;
    // Single or No employerSpecific statuses
    if (employerSpecificJoin.length === 0 || employerSpecificJoin.length === 1) {
      flattenedParticipantList.push(participant);
    } else {
      employerSpecificJoin.forEach((status) => {
        flattenedParticipantList.push({
          ...participantInfo,
          employerSpecificJoin: [status],
        });
      });
    }
  });
  return flattenedParticipantList;
};

const scrubParticipantData = (raw, joinNames) =>
  raw.map((participant) => {
    const statusInfos = [];

    const decomposeStatusInfo = (statusInfo) => ({
      id: statusInfo.id,
      createdAt: statusInfo.created_at,
      employerId: statusInfo.employer_id,
      ...(statusInfo.data && Object.keys(statusInfo.data).length > 0
        ? { data: statusInfo.data }
        : {}),
      status: statusInfo.status,
      employerInfo:
        statusInfo.employerInfo && statusInfo.employerInfo.body.userInfo
          ? {
              ...statusInfo.employerInfo.body?.userInfo,
              id: statusInfo.employerInfo.body.id,
            }
          : {},
    });

    if (joinNames) {
      joinNames.forEach((joinName) => {
        if (!participant[joinName]) return;
        statusInfos.push(...participant[joinName].map(decomposeStatusInfo));
      });
    } else {
      participant.status_infos?.forEach((statusInfo) => {
        statusInfos.push(decomposeStatusInfo(statusInfo));
      });
    }

    return {
      ...participant.body,
      id: participant.id,
      statusInfos,
      rosStatuses: participant.rosStatuses
        ? participant.rosStatuses.sort((ros1, ros2) => ros2.id - ros1.id)
        : [],
    };
  });

const addSiteNameToStatusData = (raw, employerSpecificJoin) =>
  raw.map((participant) => ({
    ...participant,
    [employerSpecificJoin]: participant[employerSpecificJoin]?.map((item) => ({
      ...item,
      data: {
        ...item.data,
        siteName: item.employerSite?.body?.siteName,
      },
    })),
  }));

const addDistanceToParticipantFields = (raw, siteDistanceJoin) =>
  raw.map((participant) => ({
    ...participant,
    ...(participant[siteDistanceJoin] && {
      body: {
        ...participant.body,
        distance: participant[siteDistanceJoin][0]?.distance,
      },
    }),
  }));

const run = async (context) => {
  const {
    table,
    criteria,
    options,
    user,
    employerSpecificJoin,
    hiredGlobalJoin,
    siteDistanceJoin,
  } = context;
  try {
    let participants = await table.find(criteria, options);
    participants = flattenParticipants(participants);
    participants = addSiteNameToStatusData(participants, employerSpecificJoin);
    participants = addDistanceToParticipantFields(participants, siteDistanceJoin);
    participants = scrubParticipantData(
      participants,
      (user.isEmployer || user.isHA) && [employerSpecificJoin, hiredGlobalJoin]
    );
    return participants;
  } catch (error) {
    if (['test', 'local', 'dev'].includes(process.env.APP_ENV)) {
      const sql = await table.find(criteria, { ...options, build: true });
      // Logging debugging info for dev/local/test environments
      logger.info('participant-helper:run: sql: ', sql);
      logger.info('participant-helper:run: criteria: ', criteria);
    }
    throw new Error(`participant-helper:run: ${error}`);
  }
};

class PaginatedParticipantsFinder {
  constructor(context) {
    this.context = context;
  }

  async run() {
    return run(this.context);
  }
}

class FilteredParticipantsFinder {
  constructor(context) {
    this.context = context;
  }

  paginate(pagination, sortField) {
    const { user, employerSpecificJoin, siteDistanceJoin, siteIdDistance, rosStatuses } =
      this.context;
    this.context.options = pagination && {
      // ID is the default sort column
      order: [
        {
          field: 'id',
          direction: pagination.direction || 'asc',
          nulls: 'last', // Relevant for sorting by ascending distance
        },
      ],
      //  Using limit/offset pagination may decrease performance in the Postgres instance,
      //  however this is the only way to sort columns that does not have a deterministic
      //  ordering such as firstName.
      //  See more details: https://massivejs.org/docs/options-objects#keyset-pagination
      ...(pagination.offset && { offset: pagination.offset }),
      ...(pagination.pageSize && { limit: pagination.pageSize }),
    };

    if (sortField && sortField !== 'id' && this.context.options.order) {
      let joinFieldName = `body.${sortField}`;

      if (sortField === 'distance' && siteIdDistance) {
        joinFieldName = `${siteDistanceJoin}.distance`;
      }

      if (sortField === 'rosStartDate') {
        joinFieldName = `${rosStatuses}.data.date`;
      }

      if (sortField === 'rosSiteName') {
        joinFieldName = `rosSite.body.siteName`;
      }

      if (sortField === 'lastEngagedDate') {
        joinFieldName = `${employerSpecificJoin}.created_at`;
      }

      // If a field to sort is provided we put that as first priority
      this.context.options.order.unshift({
        field: joinFieldName,
        direction: pagination.direction || 'asc',
      });

      // To manage employer name column sorting we need to sort by employer name
      if (sortField === 'employerName' || sortField === 'lastEngagedBy') {
        this.context.options.order.unshift(
          {
            field: `employerInfo.body.userInfo.firstName`,
            direction: pagination.direction || 'asc',
          },
          {
            field: `employerInfo.body.userInfo.lastName`,
            direction: pagination.direction || 'asc',
          }
        );
      }

      if (sortField === 'siteName') {
        this.context.options.order.unshift({
          field: `employerSite.body.siteName`,
          direction: pagination.direction || 'asc',
        });
      }

      if (sortField === 'status') {
        if (user.isEmployer || user.isHA) {
          this.context.options.order.unshift({
            field: `${employerSpecificJoin}.status`,
            direction: pagination.direction || 'asc',
          });
        } else {
          this.context.options.order.unshift({
            field: 'status_infos',
            direction: pagination.direction || 'asc',
          });
        }
      }
    }

    return new PaginatedParticipantsFinder(this.context);
  }

  async run() {
    return run(this.context);
  }
}

class FieldsFilteredParticipantsFinder {
  constructor(context) {
    this.context = context;
  }

  joinTables({ siteIdDistance, user, isOpen, isInProgress }) {
    const {
      employerSpecificJoin,
      hiredGlobalJoin,
      siteDistanceJoin,
      rosStatuses,
      orgSpecificJoin,
    } = this.context;

    // Status: Employer specific join: Here we are loading all statuses and we will filter this for user
    const employerSpecificStatusJoin = {
      [employerSpecificJoin]: {
        type: 'LEFT OUTER',
        relation: collections.PARTICIPANTS_STATUS,
        on: {
          participant_id: 'id',
          current: true,
          ...(isOpen && { employer_id: user.id }),
          ...(isInProgress && { [`data.hiddenForUserIds.${user.id}`]: null }),
        },
        ...(!isOpen && {
          employerInfo: {
            type: 'LEFT OUTER',
            relation: collections.USERS,
            decomposeTo: 'object',
            on: {
              'body.keycloakId': `${employerSpecificJoin}.employer_id`,
            },
          },
        }),
        ...(!isOpen && {
          employerSite: {
            type: 'LEFT OUTER',
            relation: collections.EMPLOYER_SITES,
            decomposeTo: 'object',
            on: {
              'body.siteId': `${employerSpecificJoin}.data.site`,
            },
          },
        }),
      },
    };

    // Joining all participant_status with employer of common sites
    const orgJoin = isOpen
      ? {
          [orgSpecificJoin]: {
            type: 'LEFT OUTER',
            relation: collections.PARTICIPANTS_STATUS,
            on: {
              participant_id: 'id',
              current: true,
              'employer_id <>': user.id,
              'data.site IN': user.sites,
            },
          },
        }
      : {};

    // Global hire: Trying to join hired statuses for participants
    const globalHireJoin = {
      [hiredGlobalJoin]: {
        type: 'LEFT OUTER',
        relation: collections.PARTICIPANTS_STATUS,
        on: {
          participant_id: 'id',
          status: participantStatus.HIRED,
          current: true,
        },
      },
    };

    // ROS: Joining return of service tables with participant to fetch ros values
    const rosJoin = {
      [rosStatuses]: {
        type: 'LEFT OUTER',
        relation: collections.ROS_STATUS,
        on: {
          participant_id: 'id',
        },
        rosSite: {
          type: 'LEFT OUTER',
          relation: collections.EMPLOYER_SITES,
          decomposeTo: 'object',
          on: {
            id: `${collections.ROS_STATUS}.site_id`,
          },
        },
      },
    };

    // Site Distance: Joining site distance with participant location
    const siteDistanceJoinJoin = {
      [siteDistanceJoin]: {
        type: 'LEFT OUTER',
        relation: collections.PARTICIPANTS_DISTANCE,
        on: {
          participant_id: 'id',
          site_id: siteIdDistance,
        },
      },
    };

    const userRejectJoin = isInProgress
      ? {
          userRejectedStatus: {
            type: 'LEFT OUTER',
            relation: collections.PARTICIPANTS_STATUS,
            on: {
              participant_id: 'id',
              current: true,
              status: rejected,
              employer_id: user.id,
            },
          },
        }
      : {};

    // Attach all joins
    return {
      ...employerSpecificStatusJoin,
      ...globalHireJoin,
      ...(!isOpen && rosJoin),
      ...(siteIdDistance && siteDistanceJoinJoin),
      ...(isOpen && orgJoin),
      ...(isInProgress && userRejectJoin),
    };
  }

  filterExternalFields({ statusFilters = [], siteIdDistance }) {
    const { user, employerSpecificJoin, hiredGlobalJoin, orgSpecificJoin, rosStatuses } =
      this.context;
    this.context.siteIdDistance = siteIdDistance;

    if (user.isEmployer || user.isHA) {
      // Check fetching open status or not
      // Flags
      let criteria = { ...this.context.criteria };
      const isOpen = statusFilters.includes(open);
      const isInProgress =
        statusFilters.includes(prospecting) ||
        statusFilters.includes(interviewing) ||
        statusFilters.includes(offerMade);
      const isHired = statusFilters.includes(hired);
      const isArchived = statusFilters.includes(archived);
      const isRejected = statusFilters.includes(rejected);
      const isRos = statusFilters.includes(ros);

      // Groups
      const inProgressStatuses = [prospecting, interviewing, offerMade];

      // Attache external tables
      this.context.table = this.context.table.join(
        this.joinTables({ siteIdDistance, user, isOpen, isInProgress })
      );

      // Apply filtering logic

      // Common employer Filtering criteria
      const employerFilteringCriteria = {
        or: [
          {
            and: [
              {
                [`${employerSpecificJoin}.employer_id`]: user.id,
                [`${employerSpecificJoin}.data.site`]: null,
              },
            ],
          },
          { [`${employerSpecificJoin}.data.site IN`]: user.sites },
        ],
      };

      // Open
      //  Choose all participants with
      //    no employer status(no interaction with employer)
      //    no status with org
      //    no global hired status
      const openQuery = {
        [`${hiredGlobalJoin}.status`]: null,
        [`${orgSpecificJoin}.status`]: null,
        [`${employerSpecificJoin}.status`]: null,
      };
      criteria = { ...criteria, ...(isOpen && openQuery) };

      // Hired status
      //  Choose all participant hired by user or orgs or load pending ack
      const hiredQuery = {
        [`${employerSpecificJoin}.status`]: hired,
        and: [
          {
            ...employerFilteringCriteria,
          },
        ],
      };
      const pendingAckQuery = {
        [`${employerSpecificJoin}.status`]: pendingAcknowledgement,
        [`${employerSpecificJoin}.employer_id`]: user.id,
      };
      criteria = isHired
        ? {
            ...criteria,
            and: [
              {
                or: [hiredQuery, pendingAckQuery],
              },
            ],
          }
        : criteria;

      // Archived/Rejected status: Only user specific
      criteria =
        isArchived || isRejected
          ? {
              ...criteria,
              [`${employerSpecificJoin}.status IN`]: [archived, rejected],
              [`${employerSpecificJoin}.employer_id`]: user.id,
            }
          : criteria;

      // ROS: Selecting participants with ros enabled
      criteria = isRos ? { ...criteria, [`${rosStatuses}.participant_id <>`]: null } : criteria;

      // Inprogress statuses: only user specific
      const inProgressStatusQuery = {
        [`${employerSpecificJoin}.status IN`]: [...inProgressStatuses, rejectAcknowledgement],
        and: [
          {
            ...employerFilteringCriteria,
          },
          {
            [`userRejectedStatus.status`]: null,
          },
        ],
      };
      criteria = isInProgress ? { ...criteria, ...inProgressStatusQuery } : criteria;
      this.context.criteria = { ...criteria };
    } else {
      // PARTICIPANTS_STATUS_INFOS is a view with a join that
      // brings all current statuses of each participant
      this.context.table = this.context.dbClient.db[views.PARTICIPANTS_STATUS_INFOS];

      if (statusFilters && statusFilters.length > 0) {
        const statuses = statusFilters.includes('open')
          ? [null, ...statusFilters]
          : statusFilters || [];
        this.context.criteria = {
          ...this.context.criteria,
          or: statuses.map((status) =>
            status
              ? {
                  'status_infos::text ilike': `%{%"status": "${status}"%}%`,
                }
              : { status_infos: null }
          ),
        };
      }
    }
    return new FilteredParticipantsFinder(this.context);
  }
}

class RegionsFilteredParticipantsFinder {
  constructor(context) {
    this.context = context;
  }

  filterParticipantFields({
    postalCodeFsa,
    lastName,
    emailAddress,
    interestFilter,
    isIndigenousFilter,
  }) {
    this.context.criteria = {
      ...this.context.criteria,
      ...(postalCodeFsa && { 'body.postalCodeFsa ilike': `${postalCodeFsa}%` }),
      ...(lastName && { 'body.lastName ilike': `${lastName}%` }),
      ...(emailAddress && { 'body.emailAddress ilike': `${emailAddress}%` }),
      ...(interestFilter && { 'body.interested <>': ['no', 'withdrawn'] }),
      ...(isIndigenousFilter && { 'body.isIndigenous =': true }),
    };
    return new FieldsFilteredParticipantsFinder(this.context);
  }

  async paginate(pagination) {
    return new FilteredParticipantsFinder(this.context).paginate(pagination);
  }
}

class ParticipantsFinder {
  constructor(dbClient, user) {
    this.dbClient = dbClient;
    this.user = user;
    this.table = dbClient.db[collections.PARTICIPANTS];
    this.employerSpecificJoin = 'employerSpecificJoin';
    this.orgSpecificJoin = 'orgSpecificJoin';
    this.hiredGlobalJoin = 'hiredGlobalJoin';
    this.siteJoin = 'siteJoin';
    this.siteDistanceJoin = 'siteDistanceJoin';
    this.rosStatuses = 'rosStatuses';
  }

  filterRegion(regionFilter) {
    this.criteria =
      this.user.isSuperUser || this.user.isMoH
        ? {
            ...(regionFilter && { 'body.preferredLocation ilike': `%${regionFilter}%` }),
          }
        : {
            ...(regionFilter && this.user.regions.includes(regionFilter)
              ? { 'body.preferredLocation ilike': `%${regionFilter}%` }
              : //  as an employer/HA, the first inner AND array is used to filter regions
                //  and statuses (unless when the status is 'unavailable', in this case
                //  we handle in the upper OR array)
                { or: [{ and: [userRegionQuery(this.user.regions, 'body.preferredLocation')] }] }),
          };
    return new RegionsFilteredParticipantsFinder(this);
  }
}

module.exports = {
  ParticipantsFinder,
};
