/* eslint-disable max-classes-per-file */
const { collections, views } = require('../db');
const { userRegionQuery } = require('./user.js');
const { participantStatus } = require('../constants');

const scrubParticipantData = (raw, joinNames) =>
  raw.map((participant) => {
    const statusInfos = [];

    const decomposeStatusInfo = (statusInfo) => ({
      createdAt: statusInfo.created_at,
      employerId: statusInfo.employer_id,
      ...(statusInfo.data && Object.keys(statusInfo.data).length > 0
        ? { data: statusInfo.data }
        : {}),
      status: statusInfo.status,
      associatedSites: statusInfo.statusSiteJoin?.map((site) => site.statusSiteDetailsJoin?.body),
      associatedSitesIds: statusInfo.statusSiteJoin?.map(
        (site) => site.statusSiteDetailsJoin?.body?.siteId
      ),
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

const addSiteNameToStatusData = (raw, employerSpecificJoin, siteJoin) =>
  raw.map((participant) => ({
    ...participant,
    [employerSpecificJoin]: participant[employerSpecificJoin]?.map((item) => ({
      ...item,
      data: {
        ...item.data,
        siteName: participant[siteJoin]?.find((site) => site.siteId === item.site)?.body.siteName,
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
    siteJoin,
  } = context;
  let participants = await table.find(criteria, options);
  participants = addSiteNameToStatusData(participants, employerSpecificJoin, siteJoin);
  participants = addDistanceToParticipantFields(participants, siteDistanceJoin);
  participants = scrubParticipantData(
    participants,
    (user.isEmployer || user.isHA) && [employerSpecificJoin, hiredGlobalJoin]
  );
  return participants;
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
    const { user, employerSpecificJoin, siteJoin, siteDistanceJoin, siteIdDistance, rosStatuses } =
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

      if (sortField === 'status') {
        joinFieldName =
          user.isEmployer || user.isHA ? `${employerSpecificJoin}.status` : 'status_infos';
      }

      if (sortField === 'distance' && siteIdDistance) {
        joinFieldName = `${siteDistanceJoin}.distance`;
      }

      if (sortField === 'siteName') {
        joinFieldName = `${siteJoin}.body.${sortField}`;
      }

      if (sortField === 'rosStartDate') {
        joinFieldName = `${rosStatuses}.data.date`;
      }

      if (sortField === 'rosSiteName') {
        joinFieldName = `rosSite.body.siteName`;
      }

      // If a field to sort is provided we put that as first priority
      this.context.options.order.unshift({
        field: joinFieldName,
        direction: pagination.direction || 'asc',
      });

      // To manage employer name column sorting we need to sort by employer name
      if (sortField === 'employerName') {
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

  filterExternalFields({ statusFilters, siteIdDistance }) {
    const {
      user,
      criteria,
      employerSpecificJoin,
      hiredGlobalJoin,
      siteJoin,
      siteDistanceJoin,
      rosStatuses,
    } = this.context;
    this.context.siteIdDistance = siteIdDistance;

    if (user.isEmployer || user.isHA) {
      const isFetchingHiresStatus = statusFilters && statusFilters.includes('hired');
      const isFetchingNonHireStatus =
        statusFilters &&
        statusFilters.filter((status) =>
          [
            participantStatus.PROSPECTING,
            participantStatus.INTERVIEWING,
            participantStatus.OFFER_MADE,
            participantStatus.REJECTED,
            participantStatus.ARCHIVED,
          ].includes(status)
        ).length > 0;

      const isFetchingOpenStatus = statusFilters && statusFilters.includes(participantStatus.OPEN);
      this.context.table = this.context.table.join({
        ...(isFetchingOpenStatus && {
          userSpecificJoin: {
            type: 'LEFT OUTER',
            relation: collections.PARTICIPANTS_STATUS,
            on: {
              participant_id: 'id',
              current: true,
              employer_id: user.id,
            },
          },
        }),
        [employerSpecificJoin]: {
          type: 'LEFT OUTER',
          relation: collections.PARTICIPANTS_STATUS,
          on: {
            participant_id: 'id',
            current: true,
          },
          employerInfo: {
            type: 'LEFT OUTER',
            relation: collections.USERS,
            decomposeTo: 'object',
            on: {
              'body.keycloakId': `${employerSpecificJoin}.employer_id`,
            },
          },
          statusSiteJoin: {
            type: 'LEFT OUTER',
            relation: collections.SITE_PARTICIPANTS_STATUS,
            on: {
              participant_status_id: `${employerSpecificJoin}.id`,
              ...(isFetchingOpenStatus &&
                user.siteIds && {
                  'site_id IN': user.siteIds,
                }),
            },
            statusSiteDetailsJoin: {
              type: 'LEFT OUTER',
              relation: collections.EMPLOYER_SITES,
              decomposeTo: 'object',
              on: {
                id: 'statusSiteJoin.site_id',
                'body.siteId IN': user.sites,
              },
            },
          },
        },
        // Join to check any past hire status for archived filer
        anyPastHiredGlobalJoin: {
          type: 'LEFT OUTER',
          relation: collections.PARTICIPANTS_STATUS,
          on: {
            participant_id: 'id',
            current: false,
            status: participantStatus.HIRED,
          },
        },
        [hiredGlobalJoin]: {
          type: 'LEFT OUTER',
          relation: collections.PARTICIPANTS_STATUS,
          on: {
            participant_id: 'id',
            current: true,
            status: participantStatus.HIRED,
          },
        },
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
        ...(siteIdDistance && {
          [siteDistanceJoin]: {
            type: 'LEFT OUTER',
            relation: collections.PARTICIPANTS_DISTANCE,
            on: {
              participant_id: 'id',
              site_id: siteIdDistance,
            },
          },
        }),
        ...(statusFilters.includes('hired') && {
          [siteJoin]: {
            type: 'LEFT OUTER',
            relation: collections.EMPLOYER_SITES,
            on: {
              'body.siteId': `${hiredGlobalJoin}.data.site`,
            },
          },
        }),
      });

      // Updating Status Filter query
      // Case: 1: Filter all hired statuses  which are matching with user sites
      // Or Case: 2: pending acknowledgement status for same user
      if (isFetchingHiresStatus) {
        const siteQuery = {
          or: [
            { [`${employerSpecificJoin}.data.site IN`]: user.sites },
            {
              and: [
                { [`${employerSpecificJoin}.status`]: 'pending_acknowledgement' },
                { [`${employerSpecificJoin}.employer_id`]: user.id },
              ],
            },
          ],
        };
        criteria.and = criteria.and ? [...criteria.and, siteQuery] : [siteQuery];
      }

      // Fetching non hire statuses
      // Case1: Fetch all statuses with same user (user.id === employer_id)
      // Case2: Fetch all statuses with same site association
      // Case3: Fetch all archived status with past hired status for site association
      if (isFetchingNonHireStatus) {
        const statusQuery = {
          or: [
            { [`${employerSpecificJoin}.employer_id`]: user.id },
            {
              and: [
                { [`${employerSpecificJoin}.employer_id <>`]: user.id },
                { 'statusSiteDetailsJoin.body <>': null },
              ],
            },
            {
              and: [
                { [`${employerSpecificJoin}.employer_id <>`]: user.id },
                { [`${employerSpecificJoin}.status`]: participantStatus.ARCHIVED },
                { [`anyPastHiredGlobalJoin.data.site IN`]: user.sites },
              ],
            },
          ],
        };
        criteria.and = criteria.and ? [...criteria.and, statusQuery] : [statusQuery];
      }

      // Checking for open status
      // Case1: Fetch all statuses with no employer attached employerSpecificJoin == NULL
      // Case2: Fetch all statuses with other employer but no site association
      if (isFetchingOpenStatus) {
        const openQuery = {
          or: [
            { [`${employerSpecificJoin}.status`]: null },
            {
              and: [{ [`userSpecificJoin.status`]: null }, { 'statusSiteJoin.id': null }],
            },
          ],
        };
        criteria.and = criteria.and ? [...criteria.and, openQuery] : [openQuery];
      }

      // Checking for ros statuses with null value
      if (statusFilters && statusFilters.includes('ros')) {
        if (criteria.and) {
          criteria.and.push({
            [`${rosStatuses}.participant_id <>`]: null,
          });
        } else {
          criteria.and = [
            {
              [`${rosStatuses}.participant_id <>`]: null,
            },
          ];
        }
      }

      if (statusFilters) {
        // Updating existing logic
        // Now only handling prospecting and hired status
        // Removing open status from the list
        const newStatusFilters = statusFilters.filter((status) => status !== 'open');
        if (newStatusFilters.length > 0) {
          const statusQuery = {
            or: newStatusFilters
              .filter((item) => item !== 'unavailable')
              .map((status) => ({ [`${employerSpecificJoin}.status`]: status })),
          };
          if (criteria.or) {
            criteria.or[0].and.push(statusQuery);
          } else {
            criteria.or = [{ and: [statusQuery] }];
          }
        }

        // we don't want hired participants listed with such statuses:
        if (
          statusFilters.some((item) =>
            [
              participantStatus.OPEN,
              participantStatus.PROSPECTING,
              participantStatus.INTERVIEWING,
              participantStatus.OFFER_MADE,
            ].includes(item)
          )
        ) {
          criteria.or[0].and.push({ [`${hiredGlobalJoin}.status`]: null });
        }

        //  the higher level 'unavailable' status filter covers participants with
        //  'prospecting', 'interviewing', 'offer_made' statuses which have
        //  been hired by someone else
        if (statusFilters.includes('unavailable')) {
          const unavailableQuery = {
            and: [
              {
                or: ['prospecting', 'interviewing', 'offer_made'].map((status) => ({
                  [`${employerSpecificJoin}.status`]: status,
                })),
              },
              { [`${hiredGlobalJoin}.status`]: 'hired' },
            ],
          };

          if (criteria.or) {
            criteria.or.push(unavailableQuery);
          } else {
            criteria.or = [unavailableQuery];
          }
        }
      }
    } else {
      // PARTICIPANTS_STATUS_INFOS is a view with a join that
      // brings all current statuses of each participant
      this.context.table = this.context.dbClient.db[views.PARTICIPANTS_STATUS_INFOS];

      if (statusFilters) {
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
