const { validate } = require('../validation');
const logger = require('../logger.js');

module.exports = function (schema) {
  return (req, resp, next) => {
    const { body } = req;
    validate(schema, body)
      .then(() => {
        next();
      })
      .catch((error) => {
        console.dir(error);
        logger.error({
          context: req.path,
          message: 'data validation fail',
          error,
        });
        resp.status(400).json({ error });
      });
  };
};
