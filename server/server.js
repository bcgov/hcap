const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const path = require('path');
const dayjs = require('dayjs');
const multer = require('multer');
const { getParticipants, parseAndSaveParticipants, setParticipantStatus } = require('./services/participants.js');
const { getEmployers, saveSites, getSites } = require('./services/employers.js');
const { validate, EmployerFormSchema, AccessRequestApproval } = require('./validation.js');
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

// Get participant records
app.get(`${apiBaseUrl}/participants`,
  keycloak.allowRolesMiddleware('health_authority', 'ministry_of_health', 'employer'),
  keycloak.getUserInfoMiddleware(),
  asyncMiddleware(async (req, res) => {
    const user = req.hcapUserInfo;
    const result = await getParticipants(user);
    return res.json({ data: result });
  }));

// Engage participant
app.post(`${apiBaseUrl}/employer-actions`,
  keycloak.allowRolesMiddleware('health_authority', 'employer'),
  keycloak.getUserInfoMiddleware(),
  asyncMiddleware(async (req, res) => {
    const user = req.hcapUserInfo;
    const result = await setParticipantStatus(
      user.id,
      req.body.participantId,
      req.body.status,
    );
    return res.json({ data: result });
  }));

// Create participant records from uploaded XLSX file
app.post(`${apiBaseUrl}/participants`,
  keycloak.allowRolesMiddleware('maximus'),
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

app.post(`${apiBaseUrl}/employer-sites`,
  keycloak.allowRolesMiddleware(),
  asyncMiddleware(async (req, res) => {
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
    const result = await getSites();
    return res.json({ data: result });
  }));

app.post(`${apiBaseUrl}/approve-user`,
  keycloak.allowRolesMiddleware('ministry_of_health'),
  asyncMiddleware(async (req, res) => {
    await validate(AccessRequestApproval, req.body);
    await keycloak.approvePendingRequest(req.body.userId, req.body.role, [req.body.region]);
    await dbClient.db.saveDoc(collections.USERS, {
      keycloakId: req.body.userId,
      sites: req.body.sites,
    });
    res.json({});
  }));

// Get user info from token
app.get(`${apiBaseUrl}/user`,
  keycloak.allowRolesMiddleware('*'),
  keycloak.getUserInfoMiddleware(),
  (req, res) => res.json({
    roles: req.hcapUserInfo.roles,
    name: req.hcapUserInfo.name,
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
