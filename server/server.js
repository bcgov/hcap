const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const { getParticipants, parseAndSaveParticipants } = require('./services/participants.js');
const { getUserRoles } = require('./services/user.js');
const { getEmployers } = require('./services/employers.js');
const {
  validate, EmployerFormSchema,
} = require('./validation.js');
const logger = require('./logger.js');
const { dbClient, collections } = require('./db');
const { errorHandler, asyncMiddleware } = require('./error-handler.js');
const keycloak = require('./keycloak-config.js').initKeycloak();

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

app.use(keycloak.middleware());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../client/build')));

const allowRoles = (...roles) => (token) => {
  if (token.hasRole('superuser')) return true;
  if (!roles.some((role) => token.hasRole(role))) return false;
  if (token.isExpired()) return false;
  return true;
};

// Return client info for Keycloak realm for the current environment
app.get(`${apiBaseUrl}/keycloak-realm-client-info`,
  asyncMiddleware(async (req, res) => res.json({
    realm: process.env.KEYCLOAK_REALM,
    url: process.env.KEYCLOAK_AUTH_URL,
    clientId: process.env.KEYCLOAK_FE_CLIENTID,
  })));

// Create new employer form
app.post(`${apiBaseUrl}/employer-form`,
  asyncMiddleware(async (req, res) => {
    await validate(EmployerFormSchema, req.body);
    try {
      const result = await dbClient.db.saveDoc(collections.EMPLOYER_FORMS, req.body);
      logger.info(`Form ${result.id} successfully created.`);
      return res.json({ id: result.id });
    } catch (error) {
      logger.error(error);
      throw error;
    }
  }));

// Get employer forms
app.get(`${apiBaseUrl}/employer-form`,
  keycloak.protect(allowRoles('employer', 'health_authority', 'ministry_of_health')),
  asyncMiddleware(async (req, res) => {
    try {
      const result = await getEmployers(req);
      return res.json({ data: result });
    } catch (error) {
      logger.error(error);
      throw error;
    }
  }));

// Get employee records
app.get(`${apiBaseUrl}/employees`,
  keycloak.protect(allowRoles('employer', 'health_authority', 'ministry_of_health')),
  asyncMiddleware(async (req, res) => {
    try {
      const result = await getParticipants(req);
      return res.json({ data: result });
    } catch (error) {
      logger.error(error);
      throw error;
    }
  }));

// Create employee records from uploaded XLSX file
app.post(`${apiBaseUrl}/employees`,
  keycloak.protect(allowRoles('maximus')),
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

    const response = await parseAndSaveParticipants(req.file);
    return res.json(response);
  }));

// Get user info from token
app.get(`${apiBaseUrl}/user`,
  keycloak.protect(),
  asyncMiddleware(async (req, res) => {
    try {
      return res.json(
        {
          roles: getUserRoles(req),
          name: req.kauth.grant.access_token.content.name,
        },
      );
    } catch (error) {
      logger.error(error);
      throw error;
    }
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
