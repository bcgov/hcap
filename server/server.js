const cors = require('cors');
const { stringReplace } = require('string-replace-middleware');
const express = require('express');
const helmet = require('helmet');
const uuid = require('uuid');
const bodyParser = require('body-parser');
const path = require('path');
const apiRouter = require('./routes');
const { errorHandler } = require('./error-handler.js');
const { expressAccessLogger } = require('./middleware');

const apiBaseUrl = '/api/v1';
const app = express();
app.disable('x-powered-by');
app.set('trust proxy');
if (
  process.env.NODE_ENV === 'local' ||
  process.env.NODE_ENV === 'test' ||
  process.env.APP_ENV === 'local'
) {
  app.use(cors());
}

/**
 * Apply nonce for use in CSP and static files
 */
app.use((req, res, next) => {
  const nonce = Buffer.from(uuid.v4()).toString('base64');
  res.locals.cspNonce = nonce;
  next();
});

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        'default-src': ["'self'"],
        'connect-src': [
          "'self'",
          'https://orgbook.gov.bc.ca',
          'https://dev.oidc.gov.bc.ca',
          'https://test.oidc.gov.bc.ca',
          'https://oidc.gov.bc.ca',
        ],
        'base-uri': ["'self'"],
        'block-all-mixed-content': [],
        'font-src': ["'self'"],
        'frame-ancestors': ["'self'"],
        'img-src': ["'self'", 'data:'],
        'object-src': ["'none'"],
        'script-src': ["'self'", (req, res) => `'nonce-${res.locals.cspNonce}'`],
        'script-src-attr': ["'none'"],
        'style-src': ["'self'", (req, res) => `'nonce-${res.locals.cspNonce}'`],
        'upgrade-insecure-requests': [],
        'form-action': ["'self'"],
      },
    },
  })
);

// Adding cache control header and xss-protection header
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  res.set('X-XSS-Protection', '1; mode=block');
  res.set('Set-Cookie', 'SameSite=Strict');
  res.set('Pragma', 'no-cache');
  next();
});

const buildFolder = process.env.NODE_ENV === 'production' ? '../client/build' : './build'; // @todo remove
// Disable Option OPTIONS / TRACE
app.use((req, res, next) => {
  const allowedMethods = ['get', 'post', 'put', 'patch', 'delete'];
  if (!allowedMethods.includes(req.method.toLocaleLowerCase())) {
    return res.status(405).send('Method is not allowed');
  }
  return next();
});

app.use((req, res, next) => {
  stringReplace({
    '<script': `<script nonce='${res.locals.cspNonce}'`,
    '<style': `<style nonce='${res.locals.cspNonce}'`,
    __CSP_NONCE__: res.locals.cspNonce,
  })(req, res, next);
});

app.use(expressAccessLogger);
app.use(express.static(path.join(__dirname, buildFolder)));
app.use(bodyParser.json());
app.use(`${apiBaseUrl}`, apiRouter);

// Client app

if (process.env.NODE_ENV === 'production') {
  app.get('/*', (req, res) => res.sendFile(path.join(__dirname, buildFolder, '/index.html')));
}

app.use(errorHandler);

module.exports = app;
