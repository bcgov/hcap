// Libs
const express = require('express');

// Frameworks
const keycloak = require('../keycloak');
const logger = require('../logger.js');
const { asyncMiddleware } = require('../error-handler.js');
const { expressRequestBodyValidator } = require('../middleware');
const { AccessRequestApproval } = require('../validation.js');
const { dbClient, collections } = require('../db');
const { sanitize } = require('../utils');
// Services
const { getUserSites } = require('../services/user.js');

/**
 * User details router
 */
const userDetailsRouter = express.Router();
userDetailsRouter.use(keycloak.allowRolesMiddleware('ministry_of_health'));
// Index: Get
// Get user details - Different from /user, this returns the
// full user sites and role specified in the query id
userDetailsRouter.get(
  '/',
  asyncMiddleware(async (req, res) => {
    const { query: { id: userId } = {} } = req;
    if (!userId) return res.status(400).send('No user id');
    const roles = await keycloak.getUserRoles(sanitize(userId));
    const sites = await getUserSites(sanitize(userId));
    return res.status(200).json({
      roles,
      sites,
    });
  })
);

// Index: Patch
userDetailsRouter.patch(
  '/',
  [
    keycloak.allowRolesMiddleware('ministry_of_health'),
    keycloak.getUserInfoMiddleware(),
    expressRequestBodyValidator(AccessRequestApproval),
  ],
  asyncMiddleware(async (req, res) => {
    const { hcapUserInfo: user, body: { userId, role, regions, sites, username } = {} } = req;
    const { id } = user;
    await keycloak.setUserRoles(sanitize(userId), role, regions);
    let action;
    // Get user details from keycloak
    const userInfo = await keycloak.getUser(sanitize(username));
    // Check doc exits or not
    const existing = await dbClient.db[collections.USERS].findDoc({
      keycloakId: sanitize(userId),
    });
    if (existing && existing.length > 0) {
      await dbClient.db[collections.USERS].updateDoc(
        {
          keycloakId: sanitize(userId),
        },
        {
          sites,
          userInfo,
        }
      );
      action = 'user-details_patch';
    } else {
      await dbClient.db[collections.USERS].saveDoc({
        keycloakId: userId,
        sites,
        userInfo,
      });
      action = 'user-details_create';
    }

    logger.info({
      action,
      performed_by: {
        username,
        id,
      },
      role_assigned: role,
      granted_access_to: userId,
      regions_assigned: regions,
      siteIds_assigned: sites,
    });
    return res.json({});
  })
);

module.exports = {
  userDetailsRouter,
};
