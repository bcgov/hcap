// Libs
const express = require('express');

// Frameworks
const keycloak = require('../keycloak');
const logger = require('../logger.js');
const { asyncMiddleware } = require('../error-handler.js');
const { expressRequestBodyValidator } = require('../middleware');
const { AccessRequestApproval } = require('../validation.js');
const { dbClient, collections } = require('../db');

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
    const roles = await keycloak.getUserRoles(userId);
    const sites = await getUserSites(userId);
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
    expressRequestBodyValidator(AccessRequestApproval)
  ],
  asyncMiddleware(async (req, res) => {
    const { hcapUserInfo: user, body: { userId, role, regions, sites } = {} } = req;
    const { username, id } = user;
    await keycloak.setUserRoles(userId, role, regions);
    await dbClient.db[collections.USERS].updateDoc(
      {
        keycloakId: userId,
      },
      {
        sites,
      }
    );
    logger.info({
      action: 'user-details_patch',
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
