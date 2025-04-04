import { validate as uuidValidate } from 'uuid';
import express from 'express';

import {
  makeParticipant,
  getParticipants,
  getParticipantByID,
  updateParticipant,
  confirmParticipantInterest,
  validateConfirmationId,
  deleteAcknowledgement,
  archiveParticipantBySite,
  deleteParticipant,
} from '../services/participants';

import {
  participantDetails,
  checkUserHasAccessToParticipant,
} from '../services/participant-details';

import {
  setParticipantStatus,
  bulkEngageParticipants,
  hideStatusForUser,
} from '../services/participant-status';
import { addParticipantToWaitlist } from '../services/waitlist';
import {
  validate,
  ParticipantQuerySchema,
  ParticipantStatusChange,
  ParticipantEditSchema,
  ExternalHiredParticipantSchema,
  ParticipantSchema,
  ArchiveRequest,
  RemoveParticipantUser,
  WaitlistEmailSchema,
  BulkEngageParticipantSchema,
} from '../validation';

import keycloak from '../keycloak';
import logger from '../logger';
import { asyncMiddleware } from '../error-handler';
import { expressRequestBodyValidator } from '../middleware/index';

import { ParticipantStatus, Role, UserRoles } from '../constants';

export const participantRouter = express.Router();
export const participantsRouter = express.Router();
export const newHiredParticipantRouter = express.Router();
export const employerActionsRouter = express.Router();

const { ALREADY_HIRED, INVALID_STATUS, INVALID_STATUS_TRANSITION, INVALID_ARCHIVE } =
  ParticipantStatus;

// Get details of a participant by ID
participantRouter.get(
  '/details/:id',
  keycloak.allowRolesMiddleware(...UserRoles),
  keycloak.getUserInfoMiddleware(),
  asyncMiddleware(async (req, res) => {
    const { id } = req.params;
    const { hcapUserInfo: user } = req;
    // Check permissions of user
    const hasAccess = await checkUserHasAccessToParticipant(id, user);
    if (!hasAccess) {
      return res.status(403).send('User has no access to this participant');
    }

    const participant = await participantDetails(id);
    if (!participant) {
      return res.status(404).send('Participant not found');
    }
    logger.info({
      action: 'participant_details_get',
      performed_by: {
        username: user.username,
        id: user.id,
      },
      on: {
        id,
      },
    });
    return res.status(200).json({ participant });
  })
);

// GET participant/
participantRouter.get(
  `/`,
  keycloak.allowRolesMiddleware(...UserRoles),
  keycloak.getUserInfoMiddleware(),
  asyncMiddleware(async (req, res) => {
    await validate(ParticipantQuerySchema, req.query);
    const user = req.hcapUserInfo;
    const { id } = req.query;
    const result = await getParticipantByID(id);
    logger.info({
      action: 'participant_get',
      performed_by: {
        username: user.username,
        id: user.id,
      },
      on: {
        id,
      },
    });
    return res.json(result);
  })
);

// Update participant data
const patchableFields = [
  'firstName',
  'lastName',
  'emailAddress',
  'phoneNumber',
  'interest',
  'history',
  'postalCode',
  'postalCodeFsa',
  'id',
];

// PATCH participant/
participantRouter.patch(
  `/`,
  keycloak.allowRolesMiddleware(Role.MinistryOfHealth),
  keycloak.getUserInfoMiddleware(),

  asyncMiddleware(async (req, res) => {
    req.body = Object.keys(req.body).reduce(
      (o, k) => (patchableFields.includes(k) ? { ...o, [k]: req.body[k] } : o),
      {}
    );
    await validate(ParticipantEditSchema, req.body);
    const user = req.hcapUserInfo;
    const result = await updateParticipant(req.body);
    logger.info({
      action: 'participant_patch',
      performed_by: {
        username: user.username,
        id: user.id,
      },
    });
    return res.json(result);
  })
);

// GET participants/confirm-interest
participantsRouter.get(
  `/confirm-interest`,
  asyncMiddleware(async (req, res) => {
    const confirmationId = req.query.id;
    const isValid = uuidValidate(confirmationId) && (await validateConfirmationId(confirmationId));
    if (isValid) {
      return res.status(200).send();
    }

    return res.status(400).send('Invalid Confirmation ID');
  })
);

participantsRouter.post(
  '/waitlist',
  asyncMiddleware(async (req, res) => {
    await validate(WaitlistEmailSchema, req.body);
    if (await addParticipantToWaitlist(req.body.email)) {
      return res.status(201).send({ message: 'Success' });
    }
    return res.status(409).send({ message: 'Email already exists' });
  })
);
// POST participants/confirm-interest
participantsRouter.post(
  `/confirm-interest`,
  asyncMiddleware(async (req, res) => {
    const success = await confirmParticipantInterest(req.query.id);

    if (success) {
      return res.status(200).send();
    }

    return res.status(400).send('Invalid Confirmation ID');
  })
);

// GET participants/
// Get participant records
participantsRouter.get(
  `/`,
  keycloak.allowRolesMiddleware(...UserRoles),
  keycloak.getUserInfoMiddleware(),
  asyncMiddleware(async (req, res) => {
    await validate(ParticipantQuerySchema, req.query);
    const user = req.hcapUserInfo;
    const {
      offset,
      pageSize,
      regionFilter,
      sortField,
      sortDirection,
      idFilter,
      fsaFilter,
      lastNameFilter,
      emailFilter,
      siteSelector,
      statusFilters,
      isIndigenousFilter,
      programFilter,
      livedLivingExperienceFilter,
      interestedWorkingPeerSupportRoleFilter,
      withdrawnParticipantsFilter,
    } = req.query;
    const result = await getParticipants(
      user,
      {
        pageSize,
        offset,
        direction: sortDirection,
      },
      sortField,
      regionFilter,
      idFilter,
      fsaFilter,
      lastNameFilter,
      emailFilter,
      siteSelector,
      statusFilters,
      isIndigenousFilter,
      programFilter,
      livedLivingExperienceFilter,
      interestedWorkingPeerSupportRoleFilter,
      withdrawnParticipantsFilter
    );
    logger.info({
      action: 'participant_get',
      performed_by: {
        username: user.username,
        id: user.id,
      },
      // Slicing to one page of results
      ids_viewed: result.data.slice(0, 10).map((person) => person.id),
    });
    return res.json(result);
  })
);

// POST participants/
participantsRouter.post(
  `/`,
  asyncMiddleware(async (req, res) => {
    await validate(ParticipantSchema, req.body);

    const participant = {
      ...req.body,
      program: req.body.program ?? 'HCA',
      educationalRequirements: req.body.educationalRequirements ?? 'Unknown',
      driverLicense: req.body.driverLicense ?? 'Unknown',
      indigenous: req.body.indigenous || 'Unknown',
      experienceWithMentalHealthOrSubstanceUse:
        req.body.experienceWithMentalHealthOrSubstanceUse || 'Unknown',
      interestedWorkingPeerSupportRole: req.body.interestedWorkingPeerSupportRole || 'Unknown',
      currentOrMostRecentIndustry: req.body.currentOrMostRecentIndustry || 'Unknown',
      roleInvolvesMentalHealthOrSubstanceUse:
        req.body.roleInvolvesMentalHealthOrSubstanceUse || 'Unknown',
      formVersion: 'v2',
      maximusId: null,
      postalCodeFsa: req.body.postalCode.substr(0, 3),
      preferredLocation: req.body.preferredLocation.join(';'),
      interested: 'yes',
      nonHCAP: null,
      crcClear: null,
      callbackStatus: false,
      userUpdatedAt: new Date().toJSON(),
    };

    try {
      const response = await makeParticipant(participant);
      logger.info({
        action: 'single_participant_post',
        performed_by: null,
        id: response.id,
      });

      return res.status(201).json(response);
    } catch (excp) {
      return res.status(500).send('Failed to create participant');
    }
  })
);

if (process.env.APP_ENV === 'local') {
  participantsRouter.delete(
    '/',
    [
      keycloak.allowRolesMiddleware(Role.Superuser),
      expressRequestBodyValidator(RemoveParticipantUser),
    ],
    asyncMiddleware(async (req, res) => {
      const { body: { email } = { email: null } } = req;
      if (email) {
        await deleteParticipant({ email });
        logger.info({
          action: 'participant-delete',
          email,
        });
        res.status(200).send({});
      } else {
        res.status(400).send('Required a valid email address');
      }
    })
  );
}

// POST new-hired-participant/
// Add Hired Participant to Database
newHiredParticipantRouter.post(
  `/`,
  keycloak.allowRolesMiddleware(Role.HealthAuthority, Role.Employer, Role.MHSUEmployer),
  keycloak.getUserInfoMiddleware(),
  asyncMiddleware(async (req, res) => {
    await validate(ExternalHiredParticipantSchema, req.body);
    try {
      const user = req.hcapUserInfo;
      // due to console warning with Select dropdown in MaterialUI need to handle this on BE
      const industry =
        req.body.currentOrMostRecentIndustry === 'Other, please specify:' &&
        req.body.otherIndustry !== ''
          ? req.body.otherIndustry
          : req.body.currentOrMostRecentIndustry;

      // no need to save otherIndustry, we replace currentOrMostRecentIndustry with value if exists
      delete req.body.otherIndustry;

      const participantInfo = {
        ...req.body,
        crcClear: 'yes',
        interested: 'yes',
        callbackStatus: false,
        userUpdatedAt: new Date().toJSON(),
        postalCodeFsa: req.body.postalCode.substr(0, 3),
        preferredLocation: req.body.preferredLocation,
        currentOrMostRecentIndustry: industry,
        // select dropdown doesnt like true false values, so handle that on BE
        eligibility: req.body.eligibility === 'Yes',
      };

      const response = await makeParticipant(participantInfo);
      await setParticipantStatus(user.id, response.id, ParticipantStatus.PROSPECTING);
      await setParticipantStatus(user.id, response.id, ParticipantStatus.INTERVIEWING, {
        contacted_at: participantInfo.contactedDate,
      });
      await setParticipantStatus(user.id, response.id, ParticipantStatus.OFFER_MADE);
      await setParticipantStatus(user.id, response.id, ParticipantStatus.HIRED, {
        site: participantInfo.site,
        program: participantInfo.program,
        positionTitle: participantInfo.positionTitle,
        positionType: participantInfo.positionType,
        hiredDate: participantInfo.hiredDate,
        startDate: participantInfo.startDate,
      });

      logger.info({
        action: 'hired_participant_post',
        performed_by: {
          username: user.username,
          id: user.id,
        },
        participant_id: response.id,
      });

      return res.status(201).json(response);
    } catch (excp) {
      return res.status(400).send(`${excp}`);
    }
  })
);
// POST ha-actions/withdraw
// Withdraw a participant
employerActionsRouter.post(
  '/archive',
  keycloak.allowRolesMiddleware(Role.HealthAuthority),
  keycloak.getUserInfoMiddleware(),
  asyncMiddleware(async (req, res) => {
    await validate(ArchiveRequest, req.body);
    const user = req.hcapUserInfo;
    const success = await archiveParticipantBySite(
      req.body.site,
      req.body.participantId,
      req.body.data,
      user.id
    );
    if (!success) {
      return res.status(400).json({ message: 'Could not find user' });
    }
    logger.info({
      action: 'employer-actions_post',
      performed_by: {
        username: user.username,
        id: user.id,
      },
      participant_id: req.body.participantId,
      status: 'archived',
    });
    return res.status(201).json({ message: 'success' });
  })
);

// POST employer-actions/
// Engage participant
employerActionsRouter.post(
  `/`,
  keycloak.allowRolesMiddleware(
    Role.MinistryOfHealth,
    Role.HealthAuthority,
    Role.Employer,
    Role.MHSUEmployer
  ),
  keycloak.getUserInfoMiddleware(),
  asyncMiddleware(async (req, res) => {
    await validate(ParticipantStatusChange, req.body);
    const { site, data = {}, participantId, status, currentStatusId = null } = req.body;
    const user = req.hcapUserInfo;
    // Check participant
    const [participant] = await getParticipantByID(participantId);
    if (!participant) {
      return res.status(400).json({ message: 'Could not find participant' });
    }
    // Check site access
    if (site && !user.isMoH && !user.sites.includes(site)) {
      return res.status(400).json({
        message: 'User does not have access to this site',
      });
    }
    const result = await setParticipantStatus(
      user.id,
      participantId,
      status,
      { site, ...data },
      user,
      currentStatusId
    );
    logger.info({
      action: 'employer-actions_post',
      performed_by: {
        username: user.username,
        id: user.id,
      },
      participant_id: participantId,
      status,
    });
    let returnStatus = 201;
    if (
      [ALREADY_HIRED, INVALID_ARCHIVE, INVALID_STATUS, INVALID_STATUS_TRANSITION].includes(
        result.status
      )
    ) {
      returnStatus = 400;
    }
    return res.status(returnStatus).json({ data: result });
  })
);

employerActionsRouter.delete(
  '/acknowledgment',
  keycloak.allowRolesMiddleware(Role.HealthAuthority, Role.Employer, Role.MHSUEmployer),
  keycloak.getUserInfoMiddleware(),
  asyncMiddleware(async (req, res) => {
    // Get user
    const user = req.hcapUserInfo;
    // Get request body
    const {
      body: { participantId, multiOrgHire, currentStatusId } = {
        participantId: null,
        multiOrgHire: null,
        currentStatusId: null,
      },
    } = req;
    if (!participantId) {
      return res.status(400).send('Missing participantId');
    }

    if (multiOrgHire) {
      await hideStatusForUser({ userId: user.id, statusId: currentStatusId });
      logger.info({
        action: 'acknowledgment_update',
        performed_by: {
          username: user.username,
          id: user.id,
        },
        participantId,
      });
      return res.status(201).json({ message: 'Participant status acknowledged and closed' });
    }
    const { success, message } = await deleteAcknowledgement(participantId);
    if (!success) {
      return res.status(400).json({ message });
    }
    logger.info({
      action: 'acknowledgment_delete',
      performed_by: {
        username: user.username,
        id: user.id,
      },
      participantId,
    });
    return res.status(200).json({ message });
  })
);

/**
 * Bulk Engage
 * Expect body: { participants: [ids...], sites: [{id: #site_id}, ...]}
 * Response: [{ participantId: #id, status: #status, success: true/false }]
 * @deprecated Not used by FE or scripts
 */
employerActionsRouter.post(
  '/bulk-engage',
  keycloak.allowRolesMiddleware(Role.HealthAuthority),
  keycloak.getUserInfoMiddleware(),
  asyncMiddleware(async (req, res) => {
    // Validate Body
    const { body, hcapUserInfo: user } = req;
    await validate(BulkEngageParticipantSchema, body);
    const result = await bulkEngageParticipants({ ...body, user });
    logger.info({
      action: 'employer-action_bulk-engage_post',
      performed_by: {
        username: user.username,
        id: user.id,
      },
      ids: body.participants,
    });
    return res.status(201).json(result);
  })
);
