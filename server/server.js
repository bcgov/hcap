const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const path = require('path');
const { Readable } = require('stream');
const multer = require('multer');
const readXlsxFile = require('read-excel-file/node');
const {
  validate, LoginSchema, EmployerFormSchema, EmployeeBatchSchema,
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

// Create employee records from uploaded XLSX file
app.post(`${apiBaseUrl}/employees`,
  keycloak.protect('admin'),
  multer().single('file'),
  asyncMiddleware(async (req, res) => {
    const bufferToStream = (binary) => new Readable({
      read() {
        this.push(binary);
        this.push(null);
      },
    });
    const columnMap = {
      NAME: 'name',
      DATE: 'date',
    };
    const { rows } = await readXlsxFile(bufferToStream(req.file.buffer), { map: columnMap });
    await validate(EmployeeBatchSchema, rows); // Validate submitted batch against schema
    return res.json({ message: `Found ${rows.length} rows` });
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
