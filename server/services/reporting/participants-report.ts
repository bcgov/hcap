import { DEFAULT_REGION_NAME, ParticipantStatus as ps, Program } from '../../constants';
import { dbClient, collections } from '../../db';

type HistoryItem = {
  changes: { to: string; from: string; field: string }[];
  timestamp: string;
};

type location = { type: 'Point'; coordinates: [number, number] };

interface HiredJoin {
  // eslint-disable-next-line camelcase
  created_at: string;
  id: number;
  search: string;
  body: {
    history: HistoryItem[];
  };
}

interface ParticipantJoin extends HiredJoin {
  body: {
    history: HistoryItem[];
    nonHCAP: string;
    crcClear: string;
    lastName: string;
    location: location;
    firstName: string;
    maximusId: number;
    program: Program;
    driverLicense: string;
    indigenous: string;
    reasonForFindingOut: string[];
    currentOrMostRecentIndustry: string;
    experienceWithMentalHealthOrSubstanceUse: string;
    interestedWorkingPeerSupportRole: string;
    interested: string;
    postalCode: string;
    phoneNumber: string;
    emailAddress: string;
    postalCodeFsa: string;
    /** ISO datetime string */
    userUpdatedAt: string;
    callbackStatus: false;
    preferredLocation: string;
  };
}

interface EmployerSiteJoin extends HiredJoin {
  body: {
    history: HistoryItem[];
    city: string;
    isRHO: boolean;
    siteId: number;
    address: string;
    location: location;
    siteName: string;
    postalCode: string;
    operatorName: string;
    operatorEmail: string;
    operatorPhone: string;
    userUpdatedAt: string;
    healthAuthority: string;
    siteContactEmail: string;
    siteContactPhone: string;
    siteContactLastName: string;
    siteContactFirstName: string;
    registeredBusinessName: string;
    siteContactPhoneNumber: string;
    operatorContactLastName: string;
    siteContactEmailAddress: string;
    operatorContactFirstName: string;
  };
}

interface ArchivedJoin extends HiredJoin {
  data: {
    history: HistoryItem[];
    site: number;
    type: string;
    reason: string;
    remainingInSectorOrRoleOrAnother: string;
    status: string;
    /** YYYY/MM/DD format date string */
    endDate: string;
    confirmed: boolean;
  };
  // eslint-disable-next-line camelcase
  participant_id: number;
  status: string;
}

type HiredEntry = {
  // eslint-disable-next-line camelcase
  created_at: Date;
  current: boolean;
  data: {
    site: number;
    /** YYYY/MM/DD format date string */
    hiredDate: string;
    /** YYYY/MM/DD format date string */
    startDate: string;
    positionType: string;
    positionTitle: string;
    program: string;
  };
  employer: string;
  id: number;
  // eslint-disable-next-line camelcase
  participant_id: number;
  status: string;
  participantJoin: [ParticipantJoin];
  employerSiteJoin: [EmployerSiteJoin];
  duplicateArchivedJoin: [];
  archivedJoin: [ArchivedJoin];
  // eslint-disable-next-line camelcase
  employer_id: string;
};

/**
 * Maps a hired entry to the report format
 * @param entry The hired entry from the database
 * @returns Formatted report entry
 */
const mapHiredEntryToReport = (entry: HiredEntry) => ({
  participantId: entry.participant_id,
  firstName: entry.participantJoin?.[0]?.body?.firstName,
  lastName: entry.participantJoin?.[0]?.body?.lastName,
  employerId: entry.employer_id,
  email: entry.participantJoin?.[0]?.body?.emailAddress,
  program: entry.participantJoin?.[0].body?.program,
  driverLicense: entry.participantJoin?.[0].body?.driverLicense,
  indigenous: entry.participantJoin?.[0].body?.indigenous,
  reasonForFindingOut: entry.participantJoin?.[0].body?.reasonForFindingOut?.join(','),
  currentOrMostRecentIndustry: entry.participantJoin?.[0].body?.currentOrMostRecentIndustry,
  experienceWithMentalHealthOrSubstanceUse:
    entry.participantJoin?.[0].body?.experienceWithMentalHealthOrSubstanceUse,
  interestedWorkingPeerSupportRole:
    entry.participantJoin?.[0].body?.interestedWorkingPeerSupportRole,
  employerRegion: entry.employerSiteJoin?.[0]?.body?.healthAuthority,
  employerSite: entry.employerSiteJoin?.[0]?.body?.siteName,
  employerCity: entry.employerSiteJoin?.[0]?.body.city,
  employerSiteId: entry.employerSiteJoin?.[0]?.body?.siteId,
  startDate: entry.data?.startDate,
  hiredDate: entry.data?.hiredDate,
  withdrawReason: entry.archivedJoin?.[0]?.data?.reason,
  withdrawDate: entry.archivedJoin?.[0]?.data?.endDate,
});

export const getParticipantsReport = async () => {
  const inProgressEntries = await dbClient.db[collections.PARTICIPANTS_STATUS]
    .join({
      participantJoin: {
        type: 'LEFT OUTER',
        relation: collections.PARTICIPANTS,
        on: {
          id: 'participant_id',
        },
      },
      hiredOrArchivedJoin: {
        type: 'LEFT OUTER',
        relation: collections.PARTICIPANTS_STATUS,
        on: {
          participant_id: 'participant_id',
          status: [ps.HIRED, ps.ARCHIVED],
          current: true,
        },
      },
      employerUserJoin: {
        type: 'LEFT OUTER',
        relation: collections.USERS,
        on: {
          id: 'employer_id',
        },
      },
    })
    .find({
      current: true,
      status: [ps.PROSPECTING, ps.INTERVIEWING, ps.OFFER_MADE],
      'hiredOrArchivedJoin.status': null,
    });

  const healthAuthorities = [];
  (await dbClient.db[collections.EMPLOYER_SITES].find({})).forEach((item) => {
    healthAuthorities[item.body.siteId] = item.body.healthAuthority;
  });

  return inProgressEntries.map((entry) => ({
    participantId: entry.participant_id,
    participantFsa: entry.participantJoin?.[0]?.body.postalCodeFsa,
    employerId: entry.employer_id,
    employerEmail: entry.employerJoin?.[0]?.body.userInfo.email,
    employerhealthRegion: [
      ...new Set(entry.employerUserJoin?.[0]?.body?.sites.map((id) => healthAuthorities[id])),
    ].join('; '),
  }));
};

/**
 * Get hired participants report with optional pagination
 * @param {string} region health region
 * @param {number} offset pagination offset (optional)
 * @param {number} limit pagination limit (optional)
 * @returns {Promise<Array>} hired participants data
 */
export const getHiredParticipantsReport = async (
  region = DEFAULT_REGION_NAME,
  offset = null,
  limit = null
) => {
  const searchOptions = {
    status: [ps.HIRED],
    'duplicateArchivedJoin.status': null,
    // 'employerSiteJoin.body.siteId::int >': 0, // Ensures that at least one site is found
  };

  if (region !== DEFAULT_REGION_NAME) {
    searchOptions['employerSiteJoin.body.healthAuthority'] = region;
  }

  // Create a query builder
  const query = dbClient.db[collections.PARTICIPANTS_STATUS].join({
    participantJoin: {
      type: 'LEFT OUTER',
      relation: collections.PARTICIPANTS,
      on: {
        id: 'participant_id',
      },
    },
    employerSiteJoin: {
      type: 'LEFT OUTER',
      relation: collections.EMPLOYER_SITES,
      on: {
        'body.siteId': 'data.site',
      },
    },
    duplicateArchivedJoin: {
      type: 'LEFT OUTER',
      relation: collections.PARTICIPANTS_STATUS,
      on: {
        participant_id: 'participant_id',
        status: ps.ARCHIVED,
        current: true,
        'data.type': 'duplicate',
      },
    },
    archivedJoin: {
      type: 'LEFT OUTER',
      relation: collections.PARTICIPANTS_STATUS,
      on: {
        participant_id: 'participant_id',
        status: ps.ARCHIVED,
        current: true,
        'data.type <>': 'duplicate',
      },
    },
  });

  let hiredEntries: HiredEntry[];

  // If pagination is requested, use it
  if (limit !== null && offset !== null) {
    hiredEntries = await query.find(searchOptions, {
      limit: limit,
      offset: offset,
      order: [{ field: 'participant_id', direction: 'asc' }],
    });
  } else {
    // Original implementation without pagination
    hiredEntries = await query.find(searchOptions);
  }

  return hiredEntries.map(mapHiredEntryToReport);
};

export const getRejectedParticipantsReport = async () => {
  const rejectedEntries = await dbClient.db[collections.PARTICIPANTS_STATUS]
    .join({
      participantJoin: {
        type: 'LEFT OUTER',
        relation: collections.PARTICIPANTS,
        on: {
          id: 'participant_id',
        },
      },
      employerJoin: {
        type: 'LEFT OUTER',
        relation: collections.USERS,
        on: {
          id: 'employer_id',
        },
      },
      hiredJoin: {
        type: 'LEFT OUTER',
        relation: collections.PARTICIPANTS_STATUS,
        on: {
          participant_id: 'participant_id',
          status: ps.HIRED,
          current: true,
        },
      },
    })
    .find({
      current: true,
      status: ps.REJECTED,
      'hiredJoin.status': null,
    });

  const sites = await dbClient.db[collections.EMPLOYER_SITES].findDoc({});

  return rejectedEntries
    .map((entry) => {
      const user = entry.employerJoin.map((employer) => employer.body)[0];
      return {
        participantId: entry.participant_id,
        employerId: entry.employer_id,
        participantInfo: entry.participantJoin[0].body,
        employerInfo: {
          ...user,
          email: entry.employerJoin?.[0]?.body.userInfo.email,
          regions: user.sites.map(
            (site) => sites.find((item) => item.siteId === site).healthAuthority
          ),
        },
        rejection: entry.data,
        date: entry.created_at,
      };
    })
    .filter((entry) => entry.participantInfo.interested !== 'withdrawn');
};

export const getNoOfferParticipantsReport = async () => {
  const participants = await dbClient.db[collections.PARTICIPANTS]
    .join({
      statusJoin: {
        type: 'LEFT OUTER',
        relation: collections.PARTICIPANTS_STATUS,
        on: {
          participant_id: 'id',
          current: true,
        },
      },
    })
    .find({
      or: [{ 'body.interested <>': ['withdrawn', 'no'] }, { 'body.interested IS': null }],
      'body.preferredLocation <>': 'Northern',
    });

  const noOffer = participants.filter((participant) =>
    participant.statusJoin.every((status) => ![ps.HIRED, ps.OFFER_MADE].includes(status.status))
  );

  return noOffer.map((participant) => ({
    id: participant.id,
    ...participant.body,
  }));
};
