import type { Request, Response } from 'express';
import logger from '../logger';

// This should have proper typing from Keycloak, if it exists
interface HasKauth {
  kauth;
}

export default (req: Request & HasKauth, res: Response, next: () => void) => {
  res.on('finish', () => {
    const { path: pathName, method, ip, baseUrl = '' } = req;
    const { statusCode } = res;
    const skipPaths = [
      'static',
      'healthcheck',
      'js',
      'css',
      'keycloak-realm-client-info',
      'favicon',
      'sitemap.xml',
    ];
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
        bcsc_guid: bcscGuid = null,
      } = req.kauth?.grant?.access_token?.content || {};
      logger[logLevel]({
        context: 'access-log',
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
                bcscGuid,
              }
            : null,
      });
    }
  });
  next();
};
