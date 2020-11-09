const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const {
  validate, LoginSchema, EmployerFormSchema, EmployeeFormSchema,
} = require('./validation.js');
const logger = require('./logger.js');
const { dbClient, collections } = require('./db');
const { errorHandler, asyncMiddleware } = require('./error-handler.js');
const keycloak = require('./keycloak-config.js').initKeycloak();

const upload = multer({ dest: 'uploads/' });

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

app.post(`${apiBaseUrl}/employee-upload-file`,
  keycloak.protect('admin'),
  upload.single('file'),
  asyncMiddleware(async (req, res) => {
    const { file } = req;
    return res.json({ result: file });
  }));

// Login endpoint
// TODO not implemented
app.post(`${apiBaseUrl}/login`,
  asyncMiddleware(async (req, res) => {
    await validate(LoginSchema, req.body);

    // TODO implement login, success mocked
    const result = 'success';
    return res.json({ result });
  }));

// Create new employer form
// TODO needs to be secured if/when login implemented
app.post(`${apiBaseUrl}/employer-form`,
  asyncMiddleware(async (req, res) => {
    await validate(EmployerFormSchema, req.body); // Validate submitted form against schema
    try {
      const result = await dbClient.db.saveDoc(collections.EMPLOYER_FORMS, req.body);
      logger.info(`Form ${result.id} successfully created.`);
      return res.json({ id: result.id });
    } catch (error) {
      logger.error(error);
      throw error;
    }
  }));

// Create new employee form, not secured
app.post(`${apiBaseUrl}/employee-form`,
  asyncMiddleware(async (req, res) => {
    await validate(EmployeeFormSchema, req.body); // Validate submitted form against schema

    const result = await dbClient.db.saveDoc(collections.EMPLOYEE_FORMS, req.body);

    return res.json({ id: result.id });
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
