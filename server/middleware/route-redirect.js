const logger = require('../logger.js');
module.exports = ({ redirect, match, log = false }) => {
  return (req, res, next) => {
    const { baseUrl } = req;
    if (baseUrl.includes(match)) {
      if (log) {
        logger.info(`Redirecting ${path} => ${redirect}`);
      }
      res.redirect(redirect);
    } else {
      next();
    }
  };
};
