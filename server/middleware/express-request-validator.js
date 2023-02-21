import { validate } from '../validation';
import logger from '../logger';

export default function expressRequestBodyValidatorMiddleware(schema) {
  return (req, resp, next) => {
    const { body } = req;
    validate(schema, body)
      .then(() => {
        next();
      })
      .catch((error) => {
        logger.error({
          context: req.path,
          message: 'data validation failed!',
          error,
        });
        resp.status(400).json({ error });
      });
  };
}
