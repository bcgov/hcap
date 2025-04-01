import express from 'express';
import { Role, UserRoles } from '../constants';
import keycloak from '../keycloak';
import logger from '../logger';
import { asyncMiddleware } from '../error-handler';
import { CreateSiteSchema, EditSiteSchema, EditSiteHiredParticipantSchema } from '../validation';
import { expressRequestBodyValidator, routeRedirect } from '../middleware';
import {
  saveSingleSite,
  updateSite,
  getSitesForUser,
  getSitesForRegion,
  getAllSites,
  getSiteByID,
} from '../services/employers';
import {
  getHiredParticipantsBySite,
  getWithdrawnParticipantsBySite,
  updateSiteParticipants,
} from '../services/participants';
import { sanitize } from '../utils';
// Main router
const router = express.Router();

// Index routes

// Create: Post
router.post(
  '/',
  [
    keycloak.allowRolesMiddleware(Role.MinistryOfHealth),
    keycloak.getUserInfoMiddleware(),
    expressRequestBodyValidator(CreateSiteSchema),
  ],
  asyncMiddleware(async (req, resp) => {
    try {
      const { body, hcapUserInfo: user } = req;
      const response = await saveSingleSite(body);
      logger.info({
        action: 'employer-sites_post',
        performed_by: {
          username: user.username,
          id: user.id,
        },
        site_id: response.siteId,
      });
      return resp.status(201).json(response);
    } catch (excp) {
      if (excp.code === '23505') {
        return resp.status(400).send({ siteId: sanitize(req.body.siteId), status: 'Duplicate' });
      }
      return resp.status(400).send(`${excp}`);
    }
  })
);

router.patch(
  '/participant_status',
  [
    keycloak.allowRolesMiddleware(Role.MinistryOfHealth),
    keycloak.getUserInfoMiddleware(),
    expressRequestBodyValidator(EditSiteHiredParticipantSchema),
  ],
  asyncMiddleware(async (req, res) => {
    const { body, hcapUserInfo: user } = req;
    const { participantId, status } = body;
    try {
      logger.info({
        action: 'participant-status_patch',
        performed_by: {
          username: user.username,
          id: user.id,
        },
        participant_id: participantId,
        new_status: status,
      });

      const response = await updateSiteParticipants(body);

      return res.json(response);
    } catch (error) {
      logger.error({
        action: 'participant-status_patch_error',
        performed_by: {
          username: user.username,
          id: user.id,
        },
        participant_id: participantId,
        error_message: error.message,
      });
      return res.status(400).send(`Error: ${error.message}`);
    }
  })
);

// Update: Patch
router.patch(
  '/:id',
  [
    keycloak.allowRolesMiddleware(Role.MinistryOfHealth),
    keycloak.getUserInfoMiddleware(),
    expressRequestBodyValidator(EditSiteSchema),
  ],
  asyncMiddleware(async (req, res) => {
    const { body, hcapUserInfo: user } = req;
    try {
      const response = await updateSite(req.params.id, body);
      logger.info({
        action: 'employer-sites_patch',
        performed_by: {
          username: user.username,
          id: user.id,
        },
        siteID: req.params.id,
      });
      return res.json(response);
    } catch (error) {
      return res.status(400).send(`${error}`);
    }
  })
);

// Read: Get *All* Sites
router.get(
  '/',
  [
    keycloak.allowRolesMiddleware(...UserRoles),
    keycloak.getUserInfoMiddleware(),
    routeRedirect({ redirect: '/api/v1/employer-sites/details', match: 'employer-sites-detail' }),
  ],
  asyncMiddleware(async (req, res) => {
    const { hcapUserInfo: user } = req;
    const result = await getAllSites();

    logger.info({
      action: 'employer-sites_get-all',
      performed_by: {
        username: user.username,
        id: user.id,
      },
      sites_accessed: result.map((site) => site.siteId),
    });
    return res.json({ data: result });
  })
);

router.get(
  '/region',
  [
    keycloak.allowRolesMiddleware(Role.HealthAuthority),
    keycloak.getUserInfoMiddleware(),
    routeRedirect({ redirect: '/api/v1/employer-sites/details', match: 'employer-sites-detail' }),
  ],
  asyncMiddleware(async (req, res) => {
    const { hcapUserInfo: user } = req;

    if (!user.regions.length) {
      return res.status(404).json({ error: 'Health Authority user has no assigned regions' });
    }
    const result = await getSitesForRegion(user.regions);
    logger.info({
      action: 'health-authority-sites_get',
      performed_by: {
        username: user.username,
        id: user.id,
      },
      sites_accessed: result.map((site) => site.siteId),
    });
    return res.json({ data: result });
  })
);

// Read: Get All User Sites
router.get(
  '/user',
  [
    keycloak.allowRolesMiddleware(...UserRoles),
    keycloak.getUserInfoMiddleware(),
    routeRedirect({ redirect: '/api/v1/employer-sites/details', match: 'employer-sites-detail' }),
  ],
  asyncMiddleware(async (req, res) => {
    const { hcapUserInfo: user } = req;

    const result = await getSitesForUser(user);

    logger.info({
      action: 'employer-sites_get',
      performed_by: {
        username: user.username,
        id: user.id,
      },
      sites_accessed: result.map((site) => site.siteId),
    });
    return res.json({ data: result });
  })
);

/**
 * @deprecated since Feb 2021
 * This endpoint was a misnomer, it was named sites but actually retrieved a single EEOI:
 *   /employer-form/:id - EEOI details, direct replacement for this function
 *   /employer-sites/:id - new site details endpoint
 */
router.get(
  '/details',
  [
    keycloak.allowRolesMiddleware(Role.MinistryOfHealth, Role.HealthAuthority),
    keycloak.getUserInfoMiddleware(),
  ],
  (req, res) => {
    const { hcapUserInfo: user } = req;
    logger.info({
      action: 'employer-sites-detail_get',
      performed_by: {
        username: user.username,
        id: user.id,
      },
      eeoi_id: req.query.id,
    });
    return res.json({ data: '' });
  }
);

// Read: Get single
router.get(
  '/:id',
  [
    keycloak.allowRolesMiddleware(Role.MinistryOfHealth, Role.HealthAuthority),
    keycloak.getUserInfoMiddleware(),
  ],
  asyncMiddleware(async (req, res) => {
    const { hcapUserInfo: user, params } = req;
    const { id } = params;
    if (!parseInt(id, 10)) {
      // parseInt will return NaN (a falsey value) if it cannot parse the string
      return res.status(400).json({ error: 'Invalid site id' });
    }
    const result = await getSiteByID(id);
    logger.info({
      action: 'employer-sites-detail_get',
      performed_by: {
        username: user.username,
        id: user.id,
      },
      site_internal_id: result.id,
      site_id: result.siteId,
    });
    if (user.isHA && !user.regions.includes(result.healthAuthority)) {
      return res.status(403).json({ error: 'you do not have permissions to view this site' });
    }
    return res.json(result);
  })
);

// Read: Get all participant for site
// TODO: Check user authenticity to get all participant
router.get(
  '/:siteId/participants',
  [
    keycloak.allowRolesMiddleware(Role.MinistryOfHealth, Role.HealthAuthority),
    keycloak.getUserInfoMiddleware(),
  ],
  asyncMiddleware(async (req, res) => {
    const { hcapUserInfo: user, params } = req;
    const { siteId } = params;
    const hired = await getHiredParticipantsBySite(siteId);
    const withdrawn = await getWithdrawnParticipantsBySite(siteId);

    logger.info({
      action: 'site-participants_get',
      performed_by: {
        username: user.username,
        id: user.id,
      },
      on: {
        site: siteId,
      },
      for: {
        hiredParticipants: hired.map((ppt) => ppt.participantJoin.id),
        withdrawnParticipants: withdrawn.map((ppt) => ppt.participantJoin.id),
      },
    });
    return res.json({ hired, withdrawn });
  })
);

export default router;
