import { collections, views } from '../../db';
import { participantStatus } from '../../constants';
import { FilteredParticipantsFinder } from './FilteredParticipantsFinder';

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

export class FieldsFilteredParticipantsFinder {
  context;

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
          is_current: true,
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

    const userArchiveJoin = isInProgress
      ? {
          userArchiveStatus: {
            type: 'LEFT OUTER',
            relation: collections.PARTICIPANTS_STATUS,
            on: {
              participant_id: 'id',
              current: true,
              status: archived,
            },
          },
        }
      : {};

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
      ...(isInProgress && userArchiveJoin),
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
          {
            or: [
              // HCAP-1303 don't return archived + ROS participants
              { [`${rosStatuses}.participant_id`]: null },
              { [`userArchiveStatus.status`]: null },
            ],
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
