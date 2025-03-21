import cors from 'cors';
import { stringReplace } from 'string-replace-middleware';
import express from 'express';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import bodyParser from 'body-parser';
import path from 'path';
import apiRouter from './routes';
import { errorHandler } from './error-handler';
import { expressAccessLogger } from './middleware';

const apiBaseUrl = '/api/v1';
export const app = express();
app.disable('x-powered-by');
app.set('trust proxy', false);
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
  const nonce = Buffer.from(uuidv4()).toString('base64');
  res.locals.cspNonce = nonce;
  res.locals.googleVerificationContent = process.env.REACT_APP_GOOGLE_SITE_VERIFICATION;
  res.locals.collectorVariable = process.env.COLLECTOR_VARIABLE || '';
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
          'https://common-logon-dev.hlth.gov.bc.ca',
          'https://common-logon-test.hlth.gov.bc.ca',
          'https://common-logon.hlth.gov.bc.ca',
          'https://spm.apps.gov.bc.ca',
          'https://spt.apps.gov.bc.ca',
        ],
        'base-uri': ["'self'"],
        'block-all-mixed-content': [],
        'font-src': ["'self'"],
        'frame-ancestors': ["'self'"],
        'img-src': ["'self'", 'data:'],
        'object-src': ["'none'"],
        // These types should be more explicit
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'script-src': [
          "'self'",
          'https://www2.gov.bc.ca',
          (req, res: any) => `'nonce-${res.locals.cspNonce}'`,
        ],
        'script-src-attr': ["'none'"],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'style-src': ["'self'", (req, res: any) => `'nonce-${res.locals.cspNonce}'`],
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

// Disable Option OPTIONS / TRACE
app.use((req, res, next) => {
  const allowedMethods = ['get', 'post', 'put', 'patch', 'delete'];
  if (!allowedMethods.includes(req.method.toLocaleLowerCase())) {
    return res.status(405).send('Method is not allowed');
  }
  return next();
});

/**
 * Apply nonces to static files
 */
app.use((req, res, next) => {
  stringReplace({
    '<script': `<script nonce='${res.locals.cspNonce}'`,
    '<style': `<style nonce='${res.locals.cspNonce}'`,
    __CSP_NONCE__: res.locals.cspNonce,
    __GOOGLE_VERIFICATION_CONTENT__: res.locals.googleVerificationContent,
    __COLLECTOR_VARIABLE__: res.locals.collectorVariable,
  })(req, res, next);
});

app.use(expressAccessLogger);
app.use(express.static(path.join(__dirname, '../client/build')));
app.use(bodyParser.json());
app.use(`${apiBaseUrl}`, apiRouter);

// Client app

if (process.env.NODE_ENV === 'production') {
  app.get('/*', (req, res) => res.sendFile(path.join(__dirname, '../client/build', '/index.html')));
}

app.use(errorHandler);
