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
      'connect-src': ["'self'", 'https://*.apps.gov.bc.ca', 'https://orgbook.gov.bc.ca'],
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

const allowRoles = (...roles) => (token) => roles.some((role) => token.hasRole(role));

// Return client info for Keycloak realm for the current environment
app.get(`${apiBaseUrl}/keycloak-realm-client-info`,
  asyncMiddleware(async (req, res) => res.json({ realm: keycloak.realm, url: keycloak['auth-server-url'], clientId: process.env.KEYCLOAK_FE_CLIENTID })));

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
    await dbClient.db.saveDocs(collections.APPLICANTS, rows);
    return res.json({ message: `Added ${rows.length} rows` });
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
