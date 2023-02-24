import readXlsxFile from 'node-xlsx';
import { createRows, verifyHeaders } from '../../utils';
import { dbClient, collections } from '../../db';
import type {
  EmailAddressFilter,
  IsIndigenousFilter,
  LastNameFilter,
  Pagination,
  PostalCodeFsaFilter,
} from '../participants-helper';
import { ParticipantsFinder } from '../participants-helper';
import { getPostHireStatusesForParticipant } from '../post-hire-flow';
import { validate, ParticipantBatchSchema, isBooleanValue } from '../../validation';
import { HcapUserInfo } from '../../keycloak';

export const getParticipants = async (
  user?: HcapUserInfo,
  pagination?: Pagination,
  sortField?: string,
  regionFilter?: string,
  /** FSA (first half of a postal code) to filter by */
  fsaFilter?: PostalCodeFsaFilter,
  lastNameFilter?: LastNameFilter,
  emailFilter?: EmailAddressFilter,
  siteSelector?,
  statusFilters?: string[],
  isIndigenousFilter?: IsIndigenousFilter
) => {
  // Get user ids
  const participantsFinder = new ParticipantsFinder(dbClient, user);
  const interestFilter = (user.isHA || user.isEmployer) && statusFilters?.includes('open');
  let participants = await participantsFinder
    .filterRegion(regionFilter)
    .filterParticipantFields({
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
          firstName: item.firstName,
          lastName: item.lastName,
          postalCodeFsa: item.postalCodeFsa,
          preferredLocation: item.preferredLocation,
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
        firstName: item.firstName,
        lastName: item.lastName,
        postalCodeFsa: item.postalCodeFsa,
        preferredLocation: item.preferredLocation,
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
      const hiredStatus = item.statusInfos?.find((statusInfo) => statusInfo.status === 'hired');
      const hiredForAssociatedSites = hiredStatus && user.sites.includes(hiredStatus?.data.site);

      // Current Status
      const currentStatusInfo = item.statusInfos[0] || {};
      const currentStatusInProgress = !['hired', 'archived'].includes(currentStatusInfo.status);
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
        !['hired', 'archived'].includes(currentStatusInfo.status) &&
        hiredStatus.employerId === user.id;

      // Archived by org
      const archivedByOrgStatus = item.statusInfos?.find(
        (statusInfo) => statusInfo.status === 'archived' && statusInfo.employerId !== user.id
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
          ['prospecting', 'interviewing', 'offer_made', 'hired'].includes(statusInfo.status)
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

export const parseAndSaveParticipants = async (fileBuffer) => {
  const columnMap = {
    ClientID: 'maximusId',
    Surname: 'lastName',
    Name: 'firstName',
    PostalCode: 'postalCode',
    'Post Code FSA': 'postalCodeFsa',
    Phone: 'phoneNumber',
    Email: 'emailAddress',
    'EOI - FHA': 'fraser',
    'EOI - IHA': 'interior',
    'EOI - NHA': 'northern',
    'EOI - VCHA': 'vancouverCoastal',
    'EOI - VIHA': 'vancouverIsland',
    'CB1: Still Interested': 'interested',
    'CB8: Non-HCAP Opportunities': 'nonHCAP',
    'CB13: CRC Clear': 'crcClear',
  };

  const objectMap = (row) => {
    const object = { ...row };

    const preferredLocation = [];

    if (row.fraser === 1 || isBooleanValue(row.fraser)) preferredLocation.push('Fraser');
    if (row.interior === 1 || isBooleanValue(row.interior)) preferredLocation.push('Interior');
    if (row.northern === 1 || isBooleanValue(row.northern)) preferredLocation.push('Northern');
    if (row.vancouverCoastal === 1 || isBooleanValue(row.vancouverCoastal))
      preferredLocation.push('Vancouver Coastal');
    if (row.vancouverIsland === 1 || isBooleanValue(row.vancouverIsland))
      preferredLocation.push('Vancouver Island');

    object.preferredLocation = preferredLocation.join(';');
    object.callbackStatus = false;
    object.userUpdatedAt = new Date().toJSON();

    delete object.fraser;
    delete object.interior;
    delete object.northern;
    delete object.vancouverCoastal;
    delete object.vancouverIsland;

    return object;
  };

  const xlsx = readXlsxFile.parse(fileBuffer, { raw: true });
  verifyHeaders(xlsx[0].data, columnMap);
  let rows = createRows(xlsx[0].data, columnMap);
  await validate(ParticipantBatchSchema, rows);
  const lowercaseMixed = (v) => (typeof v === 'string' ? v.toLowerCase() : v);
  rows = rows.map((row) => ({
    ...row,
    interested: lowercaseMixed(row.interested),
  }));
  const response = [];
  const promises = rows.map((row) => dbClient.db.saveDoc(collections.PARTICIPANTS, objectMap(row)));
  const results = await Promise.allSettled(promises);

  results.forEach((result, index) => {
    const id = rows[index].maximusId;
    switch (result.status) {
      case 'fulfilled':
        // Update coordinates for all fulfilled promises
        response.push({ id, status: 'Success' });
        break;
      default:
        if (result.reason.code === '23505') {
          response.push({ id, status: 'Duplicate' });
        } else {
          response.push({ id, status: 'Error', message: result.reason });
        }
    }
  });
  return response;
};
