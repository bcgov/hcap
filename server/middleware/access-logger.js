const logger = require('../logger');

module.exports = (req, res, next) => {
  res.on('finish', () => {
    const { path: pathName, method, ip, baseUrl } = req;
    const { statusCode } = res;
    const skipPaths = ['/static/', 'healthcheck', 'js', 'css', 'keycloak-realm-client-info'];
    if (
      skipPaths.reduce((incoming, value) => incoming && !pathName.includes(value), true) ||
      statusCode >= 400
    ) {
      const { 'content-length': contentLength } = res.getHeaders();
      const logLevel = statusCode >= 400 ? 'error' : 'info';
      const {
        preferred_username: userName = null,
        sub = null,
        user_id: userId = null,
      } = req.kauth?.grant?.access_token?.content || {};
      logger[logLevel]({
        path: baseUrl + pathName,
        method,
        ip,
        statusCode,
        contentLength,
        user:
          sub !== null
            ? {
                userName,
                sub,
                userId,
              }
            : null,
      });
    }
  });
  next();
};
