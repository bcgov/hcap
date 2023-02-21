import logger from './logger';

// Middleware to log and sanitize errors
// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
export const errorHandler = (error, req, res, next) => {
  logger.error({
    context: 'global-server-error',
    message: error.message,
    error,
  });
  switch (error.name) {
    case 'ValidationError':
      res.status(400).send(`Validation error(s): ${error.errors}`);
      break;
    default:
      res.status(500).send('An unexpected error was encountered');
      break;
  }
};

// Wraps async request handlers to ensure next is called
export const asyncMiddleware = (f) => (req, res, next) =>
  Promise.resolve(f(req, res, next)).catch((error) => next(error));

export const applyMiddleware = (f) => (req, res, next) => f(req, res, next);
