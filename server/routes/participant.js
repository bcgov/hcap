const { validate: uuidValidate } = require('uuid');
const multer = require('multer');
const express = require('express');

const {
  makeParticipant,
  getParticipants,
  getParticipantByID,
  updateParticipant,
  parseAndSaveParticipants,
  setParticipantStatus,
  confirmParticipantInterest,
  validateConfirmationId,
} = require('../services/participants.js');
const {
  validate,
  ParticipantQuerySchema,
  ParticipantStatusChange,
  ParticipantEditSchema,
  ExternalHiredParticipantSchema,
  ParticipantSchema,
} = require('../validation.js');
const keycloak = require('../keycloak.js');
const logger = require('../logger.js');
const { asyncMiddleware } = require('../error-handler.js');

const participantRouter = express.Router();
const participantsRouter = express.Router();
const newHiredParticipantRouter = express.Router();
const employerActionsRouter = express.Router();

// GET participant/
participantRouter.get(
  `/`,
  keycloak.allowRolesMiddleware('health_authority', 'ministry_of_health', 'employer'),
  keycloak.getUserInfoMiddleware(),
  asyncMiddleware(async (req, res) => {
    await validate(ParticipantQuerySchema, req.query);
    const user = req.hcapUserInfo;
    const id = req.query;
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
  keycloak.allowRolesMiddleware('ministry_of_health'),
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
  keycloak.allowRolesMiddleware('health_authority', 'ministry_of_health', 'employer'),
  keycloak.getUserInfoMiddleware(),
  asyncMiddleware(async (req, res) => {
    await validate(ParticipantQuerySchema, req.query);
    const user = req.hcapUserInfo;
    const {
      offset,
      regionFilter,
      sortField,
      sortDirection,
      fsaFilter,
      lastNameFilter,
      emailFilter,
      siteSelector,
      statusFilters,
    } = req.query;
    const result = await getParticipants(
      user,
      {
        pageSize: 10,
        offset,
        direction: sortDirection,
      },
      sortField,
      regionFilter,
      fsaFilter,
      lastNameFilter,
      emailFilter,
      siteSelector,
      statusFilters
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

// POST participants/batch
// Create participant records from uploaded XLSX file
participantsRouter.post(
  `/batch`,
  keycloak.allowRolesMiddleware('maximus'),
  keycloak.getUserInfoMiddleware(),
  multer({
    fileFilter: (req, file, cb) => {
      if (file.fieldname !== 'file') {
        req.fileError = 'Invalid field name.';
        return cb(null, false);
      }
      if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        return cb(null, true);
      }
      req.fileError = 'File type not allowed.';
      return cb(null, false);
    },
  }).single('file'),
  asyncMiddleware(async (req, res) => {
    if (req.fileError) {
      return res.json({ status: 'Error', message: req.fileError });
    }

    try {
      const response = await parseAndSaveParticipants(req.file.buffer);
      const user = req.hcapUserInfo;
      logger.info({
        action: 'participant_post',
        performed_by: {
          username: user.username,
          id: user.id,
        },
        // Slicing to one page of results
        ids_posted: response.slice(0, 10).map((entry) => entry.id),
      });

      return res.status(201).json(response);
    } catch (excp) {
      return res.status(400).send(`${excp}`);
    }
  })
);

// POST participants/
participantsRouter.post(
  `/`,
  asyncMiddleware(async (req, res) => {
    await validate(ParticipantSchema, req.body);

    const participant = {
      ...req.body,
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

// POST new-hired-participant/
// Add Hired Participant to Database
newHiredParticipantRouter.post(
  `/`,
  keycloak.allowRolesMiddleware('employer', 'health_authority'),
  keycloak.getUserInfoMiddleware(),
  asyncMiddleware(async (req, res) => {
    await validate(ExternalHiredParticipantSchema, req.body);
    try {
      const user = req.hcapUserInfo;
      const participantInfo = req.body;
      [participantInfo.preferredLocation] = user.regions;
      participantInfo.crcClear = 'yes';
      participantInfo.interested = 'yes';
      participantInfo.callbackStatus = false;
      participantInfo.userUpdatedAt = new Date().toJSON();

      const response = await makeParticipant(participantInfo);
      await setParticipantStatus(user.id, response.id, 'prospecting');
      await setParticipantStatus(user.id, response.id, 'interviewing', {
        contacted_at: participantInfo.contactedDate,
      });
      await setParticipantStatus(user.id, response.id, 'offer_made');
      await setParticipantStatus(user.id, response.id, 'hired', {
        site: participantInfo.site,
        nonHcapOpportunity: !participantInfo.hcapOpportunity,
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

// POST employer-actions/
// Engage participant
employerActionsRouter.post(
  `/`,
  keycloak.allowRolesMiddleware('health_authority', 'employer'),
  keycloak.getUserInfoMiddleware(),
  asyncMiddleware(async (req, res) => {
    await validate(ParticipantStatusChange, req.body);
    const user = req.hcapUserInfo;
    const result = await setParticipantStatus(
      user.id,
      req.body.participantId,
      req.body.status,
      req.body.data
    );
    logger.info({
      action: 'employer-actions_post',
      performed_by: {
        username: user.username,
        id: user.id,
      },
      participant_id: req.body.participantId,
      status: req.body.status,
    });
    return res.status(201).json({ data: result });
  })
);

module.exports = {
  participantRouter,
  participantsRouter,
  newHiredParticipantRouter,
  employerActionsRouter,
};