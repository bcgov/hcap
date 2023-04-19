// Libs
import express from 'express';

// Frameworks
import keycloak from '../keycloak';
import logger from '../logger';
import { asyncMiddleware } from '../error-handler';
import { expressRequestBodyValidator } from '../middleware';
import { AccessRequestApproval } from '../validation';
import { dbClient, collections } from '../db';
import { sanitize } from '../utils';
// Services
import { getUserSites } from '../services/user';

/**
 * User details router
 */
export const userDetailsRouter = express.Router();
userDetailsRouter.use(keycloak.allowRolesMiddleware('ministry_of_health'));
// Index: Get
// Get user details - Different from /user, this returns the
// full user sites and role specified in the query id
userDetailsRouter.get(
  '/',
  asyncMiddleware(async (req, res) => {
    const { query: { id: userId } = { id: null } } = req;
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
    const {
      hcapUserInfo: user,
      body: { userId, role, regions, sites, username } = {
        userId: null,
        role: null,
        regions: null,
        sites: null,
        username: null,
      },
    } = req;
    const { id } = user;
    await keycloak.setUserRoleWithRegions(sanitize(userId), role, regions);
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
