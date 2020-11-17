const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const path = require('path');
const { Readable } = require('stream');
const multer = require('multer');
const readXlsxFile = require('read-excel-file/node');
const {
  validate, EmployerFormSchema, EmployeeBatchSchema,
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

const allowRoles = (...roles) => (token, req) => {
  req.roles = [];
  roles.forEach((role) => {
    if (token.hasRole(role)) req.roles.append(role);
  });
  if (!roles.some((role) => token.hasRole(role))) return false;
  return !token.isExpired();
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
  keycloak.protect(allowRoles('admin')),
  asyncMiddleware(async (req, res) => {
    try {
      const result = await dbClient.db[collections.EMPLOYER_FORMS].findDoc({});
      return res.json({ data: result });
    } catch (error) {
      logger.error(error);
      throw error;
    }
  }));

// Create employee records from uploaded XLSX file
app.post(`${apiBaseUrl}/employees`,
  keycloak.protect(allowRoles('admin', 'maximus')),
  multer().single('file'),
  asyncMiddleware(async (req, res) => {
    const bufferToStream = (binary) => new Readable({
      read() {
        this.push(binary);
        this.push(null);
      },
    });
    const columnMap = {
      maximusId: 'maximusId',
      eligibility: 'eligibility',
      firstName: 'firstName',
      lastName: 'lastName',
      phoneNumber: 'phoneNumber',
      emailAddress: 'emailAddress',
      postalCode: 'postalCode',
      preferredLocation: 'preferredLocation',
      consent: 'consent',
    };
    const { rows } = await readXlsxFile(bufferToStream(req.file.buffer), { map: columnMap });
    await validate(EmployeeBatchSchema, rows);
    const response = { successes: [], duplicates: [], errors: [] };
    const promises = rows.map((row) => dbClient.db.saveDoc(collections.APPLICANTS, row));
    const results = await Promise.allSettled(promises);
    results.forEach((result, index) => {
      switch (result.status) {
        case 'fulfilled':
          response.successes.push(rows[index].maximusId);
          break;
        default:
          if (result.reason.code === '23505') {
            response.duplicates.push(rows[index].maximusId);
          } else {
            response.errors.push(`${rows[index].maximusId}: ${result.reason}`);
          }
      }
    });
    return res.json(response);
  }));

// Get user roles
app.get(`${apiBaseUrl}/roles`,
  keycloak.protect(),
  asyncMiddleware(async (req, res) => {
    const { roles } = req.kauth
      .grant.access_token.content
      .resource_access[process.env.KEYCLOAK_API_CLIENTID];
    try {
      return res.json({ roles });
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
