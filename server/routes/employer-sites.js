const express = require('express');
const keycloak = require('../keycloak');
const logger = require('../logger.js');
const { asyncMiddleware } = require('../error-handler.js');
const { CreateSiteSchema, EditSiteSchema } = require('../validation');
const { expressRequestBodyValidator, routeRedirect } = require('../middleware');
const {
  saveSingleSite,
  updateSite,
  getSites,
  getSiteByID,
  getAllSites,
} = require('../services/employers');
const {
  getHiredParticipantsBySite,
  getWithdrawnParticipantsBySite,
} = require('../services/participants.js');
const { sanitize } = require('../utils.js');
// Main router
const router = express.Router();

// Index routes

// Create: Post
router.post(
  '/',
  [
    keycloak.allowRolesMiddleware('ministry_of_health'),
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

// Update: Patch
router.patch(
  '/:id',
  [
    keycloak.allowRolesMiddleware('ministry_of_health'),
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

// Read: Get All
router.get(
  '/',
  [
    keycloak.allowRolesMiddleware('health_authority', 'ministry_of_health'),
    keycloak.getUserInfoMiddleware(),
    routeRedirect({ redirect: '/api/v1/employer-sites/details', match: 'employer-sites-detail' }),
  ],
  asyncMiddleware(async (req, res) => {
    const { hcapUserInfo: user, query } = req;
    const { all } = query;
    let result;
    console.dir(query);
    if (all === 'true') {
      result = await getAllSites();
    } else {
      result = await getSites();
      if (user.isHA) {
        result = result.filter((site) => user.regions.includes(site.healthAuthority));
      }
    }

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
    keycloak.allowRolesMiddleware('health_authority', 'ministry_of_health'),
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
    keycloak.allowRolesMiddleware('health_authority', 'ministry_of_health'),
    keycloak.getUserInfoMiddleware(),
  ],
  asyncMiddleware(async (req, res) => {
    const { hcapUserInfo: user, params } = req;
    const { id } = params;
    if (!parseInt(id, 10)) {
      // parseInt will return NaN (a falsey value) if it cannot parse the string
      return res.status(400).json({ error: 'Invalid site id' });
    }
    const [result] = await getSiteByID(id);
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
    keycloak.allowRolesMiddleware('health_authority', 'ministry_of_health'),
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

module.exports = router;
