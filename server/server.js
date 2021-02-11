const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const path = require('path');
const dayjs = require('dayjs');
const multer = require('multer');
const {
  getParticipants,
  getParticipantByID,
  updateParticipant,
  parseAndSaveParticipants,
  setParticipantStatus,
  makeParticipant,
} = require('./services/participants.js');
const {
  getEmployers, getEmployerByID, saveSites, getSites, getSiteByID,
} = require('./services/employers.js');
const { getReport } = require('./services/reporting.js');
const { getUserSites } = require('./services/user.js');
const {
  validate, EmployerFormSchema, AccessRequestApproval,
  ParticipantQuerySchema, ParticipantStatusChange,
  ParticipantEditSchema, ExternalHiredParticipantSchema,
} = require('./validation.js');
const logger = require('./logger.js');
const { dbClient, collections } = require('./db');
const { errorHandler, asyncMiddleware } = require('./error-handler.js');
const keycloak = require('./keycloak.js');

const apiBaseUrl = '/api/v1';
const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      'default-src': ["'self'"],
      'connect-src': ["'self'", 'https://*.apps.gov.bc.ca', 'https://orgbook.gov.bc.ca', 'https://*.oidc.gov.bc.ca', 'https://oidc.gov.bc.ca'],
      'base-uri': ["'self'"],
      'block-all-mixed-content': [],
      'font-src': ["'self'", 'https:', 'data:'],
      'frame-ancestors': ["'self'"],
      'img-src': ["'self'", 'data:'],
      'object-src': ["'none'"],
      'script-src': ["'self'", 'https://*.gov.bc.ca'],
      'script-src-attr': ["'none'"],
      'style-src': ["'self'", 'https:', "'unsafe-inline'"],
      'upgrade-insecure-requests': [],
      'form-action': ["'self'"],
    },
  },
}));

app.use(keycloak.expressMiddleware());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../client/build')));

// Return client info for Keycloak realm for the current environment
app.get(`${apiBaseUrl}/keycloak-realm-client-info`,
  (req, res) => res.json(keycloak.RealmInfoFrontend()));

// Create new employer form
app.post(`${apiBaseUrl}/employer-form`,
  asyncMiddleware(async (req, res) => {
    await validate(EmployerFormSchema, req.body);
    const result = await dbClient.db.saveDoc(collections.EMPLOYER_FORMS, req.body);
    logger.info(`Form ${result.id} successfully created.`);
    return res.json({ id: result.id });
  }));

// Get employer forms
app.get(`${apiBaseUrl}/employer-form`,
  keycloak.allowRolesMiddleware('health_authority', 'ministry_of_health'),
  keycloak.getUserInfoMiddleware(),
  asyncMiddleware(async (req, res) => {
    const user = req.hcapUserInfo;
    const result = await getEmployers(user);
    return res.json({ data: result });
  }));

app.get(`${apiBaseUrl}/employer-form/:id`,
  keycloak.allowRolesMiddleware('health_authority', 'ministry_of_health'),
  keycloak.getUserInfoMiddleware(),
  asyncMiddleware(async (req, res) => {
    const [result] = await getEmployerByID(req.params.id);
    return res.json(result);
  }));

// Get Report
app.get(`${apiBaseUrl}/milestone-report`,
  keycloak.allowRolesMiddleware('ministry_of_health'),
  keycloak.getUserInfoMiddleware(),
  asyncMiddleware(async (req, res) => {
    const result = await getReport();
    return res.json({ data: result });
  }));

// Get participant records
app.get(`${apiBaseUrl}/participants`,
  keycloak.allowRolesMiddleware('health_authority', 'ministry_of_health', 'employer'),
  keycloak.getUserInfoMiddleware(),
  asyncMiddleware(async (req, res) => {
    await validate(ParticipantQuerySchema, req.query);
    const user = req.hcapUserInfo;
    const {
      offset, regionFilter, sortField, sortDirection,
      fsaFilter, lastNameFilter, emailFilter, statusFilters,
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
      statusFilters,
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
  }));

app.get(`${apiBaseUrl}/participant`,
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
  }));

// Update participant data
const patchableFields = [
  'firstName',
  'lastName',
  'emailAddress',
  'phoneNumber',
  'interest',
  'history',
  'id',
];

app.patch(`${apiBaseUrl}/participant`,
  keycloak.allowRolesMiddleware('ministry_of_health'),
  keycloak.getUserInfoMiddleware(),
  asyncMiddleware(async (req, res) => {
    req.body = Object.keys(req.body).reduce((o, k) => (patchableFields.includes(k)
      ? { ...o, [k]: req.body[k] }
      : o
    ), {});
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
  }));

// Engage participant
app.post(`${apiBaseUrl}/employer-actions`,
  keycloak.allowRolesMiddleware('health_authority', 'employer'),
  keycloak.getUserInfoMiddleware(),
  asyncMiddleware(async (req, res) => {
    await validate(ParticipantStatusChange, req.body);
    const user = req.hcapUserInfo;
    const result = await setParticipantStatus(
      user.id,
      req.body.participantId,
      req.body.status,
      req.body.data,
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
    return res.json({ data: result });
  }));

// Add Hired Participant to Database
app.post(`${apiBaseUrl}/new-hired-participant`,
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
      participantInfo.callbackStatus = 'false';
      participantInfo.userUpdatedAt = new Date().toJSON();

      const response = await makeParticipant(participantInfo);
      await setParticipantStatus(user.id, response.id, 'prospecting');
      await setParticipantStatus(user.id, response.id, 'interviewing', { contacted_at: participantInfo.contactedDate });
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

      return res.json(response);
    } catch (excp) {
      return res.status(400).send(`${excp}`);
    }
  }));

// Create participant records from uploaded XLSX file
app.post(`${apiBaseUrl}/participants`,
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

      return res.json(response);
    } catch (excp) {
      return res.status(400).send(`${excp}`);
    }
  }));

// Get pending users from Keycloak
app.get(`${apiBaseUrl}/pending-users`,
  keycloak.allowRolesMiddleware('ministry_of_health'),
  asyncMiddleware(async (req, res) => {
    const users = await keycloak.getPendingUsers();
    const scrubbed = users.map((user) => ({
      id: user.id,
      emailAddress: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: dayjs(user.createdTimestamp).format('YYYY-MM-DD HH:mm'),
    }));
    return res.json({ data: scrubbed });
  }));

// Get users from Keycloak
app.get(`${apiBaseUrl}/users`,
  keycloak.allowRolesMiddleware('ministry_of_health'),
  asyncMiddleware(async (req, res) => {
    const users = await keycloak.getUsers(true);
    const scrubbed = users.map((user) => ({
      id: user.id,
      emailAddress: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: dayjs(user.createdTimestamp).format('YYYY-MM-DD HH:mm'),
    }));
    return res.json({ data: scrubbed });
  }));

// Get user details - Different from /user, this returns the
// full user sites and role specified in the query id
app.get(`${apiBaseUrl}/user-details`,
  keycloak.allowRolesMiddleware('ministry_of_health'),
  asyncMiddleware(async (req, res) => {
    const userId = req.query.id;
    const roles = await keycloak.getUserRoles(userId);
    const sites = await getUserSites(userId);
    return res.json({
      roles,
      sites,
    });
  }));

app.post(`${apiBaseUrl}/employer-sites`,
  keycloak.allowRolesMiddleware(),
  asyncMiddleware(async (req, res) => {
    const user = req.hcapUserInfo;
    logger.info({
      action: 'employer-sites_post',
      performed_by: {
        username: user.username,
        id: user.id,
      },
    });
    try {
      const response = await saveSites(req.body);
      return res.json(response);
    } catch (excp) {
      return res.status(400).send(`${excp}`);
    }
  }));

app.get(`${apiBaseUrl}/employer-sites`,
  keycloak.allowRolesMiddleware('health_authority', 'ministry_of_health'),
  keycloak.getUserInfoMiddleware(),
  asyncMiddleware(async (req, res) => {
    let result = await getSites();
    const user = req.hcapUserInfo;

    if (user.isHA) {
      result = result.filter((site) => user.regions.includes(site.healthAuthority));
    }

    logger.info({
      action: 'employer-sites_get',
      performed_by: {
        username: user.username,
        id: user.id,
      },
      sites_accessed: result.map((site) => site.siteId),
    });
    return res.json({ data: result });
  }));

app.get(`${apiBaseUrl}/employer-sites/:id`,
  keycloak.allowRolesMiddleware('health_authority', 'ministry_of_health'),
  keycloak.getUserInfoMiddleware(),
  asyncMiddleware(async (req, res) => {
    const user = req.hcapUserInfo;
    const [result] = await getSiteByID(req.params.id);
    logger.info({
      action: 'employer-sites-detail_get',
      performed_by: {
        username: user.username,
        id: user.id,
      },
      eeoi_id: req.query.id,
      siteID: result.siteID,
    });
    return res.json(result);
  }));

// In development
app.get(`${apiBaseUrl}/employer-sites-detail`,
  keycloak.allowRolesMiddleware('health_authority', 'ministry_of_health'),
  keycloak.getUserInfoMiddleware(),
  asyncMiddleware(async (req, res) => {
    const user = req.hcapUserInfo;
    logger.info({
      action: 'employer-sites-detail_get',
      performed_by: {
        username: user.username,
        id: user.id,
      },
      eeoi_id: req.query.id,
    });
    return res.json({ data: '' });
  }));

app.patch(`${apiBaseUrl}/user-details`,
  keycloak.allowRolesMiddleware('ministry_of_health'),
  keycloak.getUserInfoMiddleware(),
  asyncMiddleware(async (req, res) => {
    await validate(AccessRequestApproval, req.body);
    await keycloak.setUserRoles(req.body.userId, req.body.role, req.body.regions);
    await dbClient.db[collections.USERS].updateDoc(
      {
        keycloakId: req.body.userId,
      },
      {
        sites: req.body.sites,
      },
    );

    const user = req.hcapUserInfo;
    logger.info({
      action: 'user-details_patch',
      performed_by: {
        username: user.username,
        id: user.id,
      },
      role_assigned: req.body.role,
      granted_access_to: req.body.userId,
      regions_assigned: req.body.regions,
      siteIds_assigned: req.body.sites,
    });

    res.json({});
  }));

app.post(`${apiBaseUrl}/approve-user`,
  keycloak.allowRolesMiddleware('ministry_of_health'),
  keycloak.getUserInfoMiddleware(),
  asyncMiddleware(async (req, res) => {
    await validate(AccessRequestApproval, req.body);
    await keycloak.setUserRoles(req.body.userId, req.body.role, req.body.regions);
    await dbClient.db.saveDoc(collections.USERS, {
      keycloakId: req.body.userId,
      sites: req.body.sites,
    });

    const user = req.hcapUserInfo;
    logger.info({
      action: 'approve-user_post',
      performed_by: {
        username: user.username,
        id: user.id,
      },
      role_assigned: req.body.role,
      granted_access_to: req.body.userId,
      regions_assigned: req.body.regions,
      siteIds_assigned: req.body.sites,
    });

    res.json({});
  }));

// Get user info from token
app.get(`${apiBaseUrl}/user`,
  keycloak.allowRolesMiddleware('*'),
  keycloak.getUserInfoMiddleware(),
  asyncMiddleware(async (req, res) => {
    let sites = await getSites();
    sites = sites.filter((i) => req.hcapUserInfo.sites.includes(i.siteId));
    res.json({
      roles: req.hcapUserInfo.roles,
      name: req.hcapUserInfo.name,
      sites,
    });
  }));

// Version number
app.get(`${apiBaseUrl}/version`,
  (req, res) => res.json({ version: process.env.VERSION }));

// Client app
if (process.env.NODE_ENV === 'production') {
  app.get('/*', (req, res) => res.sendFile(path.join(__dirname, '../client/build/index.html')));
}

app.use(errorHandler);

module.exports = app;
