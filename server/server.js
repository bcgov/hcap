const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const path = require('path');
const apiRouter = require('./routes');
const { errorHandler } = require('./error-handler.js');
const { expressAccessLogger } = require('./middleware');

const apiBaseUrl = '/api/v1';
const app = express();

if (process.env.NODE_ENV === 'local' || process.env.NODE_ENV === 'test') {
  app.use(cors());
}

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        'default-src': ["'self'"],
        'connect-src': [
          "'self'",
          'https://*.apps.gov.bc.ca',
          'https://orgbook.gov.bc.ca',
          'https://*.oidc.gov.bc.ca',
          'https://oidc.gov.bc.ca',
        ],
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
  })
);

app.use(expressAccessLogger);
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../client/build')));
app.use(`${apiBaseUrl}`, apiRouter);
app.use(errorHandler);

// Client app
if (process.env.NODE_ENV === 'production') {
  app.get('/*', (req, res) => res.sendFile(path.join(__dirname, '../client/build/index.html')));
}

module.exports = app;
