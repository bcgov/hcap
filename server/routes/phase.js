const express = require('express');
const keycloak = require('../keycloak');
const logger = require('../logger.js');
const { asyncMiddleware } = require('../error-handler.js');
const { CreatePhaseSchema, UpdatePhaseSchema } = require('../validation');
const { expressRequestBodyValidator } = require('../middleware');
const { createPhase, updatePhase, getAllSitePhases, getAllPhases } = require('../services/phase');
const { getSitesForUser } = require('../services/employers');
const { FEATURE_PHASE_ALLOCATION } = require('../services/feature-flags');

const router = express.Router();

// Read: Get phases/allocations for site
router.get(
  '/:id',
  [
    keycloak.allowRolesMiddleware('health_authority', 'ministry_of_health', 'employer'),
    keycloak.getUserInfoMiddleware(),
  ],
  asyncMiddleware(async (req, res) => {
    /**
     * @type {import("../keycloak").hcapUserInfo} hcapUserInfo
     */
    const user = req.hcapUserInfo;
    const siteId = parseInt(req.params.id, 10);

    // Validate request
    if (!siteId) return res.status(400).send('Invalid site ID');
    const authorized =
      user.isSuperUser ||
      user.isMoH ||
      user.isHA ||
      (user.isEmployer && (await getSitesForUser(user)).map((site) => site.id).includes(siteId));
    if (!authorized) return res.status(403).send('Unauthorized site ID');

    // Get and return data
    try {
      const result = await getAllSitePhases(siteId);
      logger.info({
        action: 'phases_get',
        performed_by: {
          username: user.username,
          id: user.id,
        },
        phases_accessed: result.map((phase) => phase.id),
        for_site: siteId,
      });
      return res.json({ data: result });
    } catch (error) {
      return error.message.includes('No site found')
        ? res.status(400).send('Invalid site ID')
        : res.status(500).send('Failed to get phases for site');
    }
  })
);

// Read: Get global phases
router.get(
  '/',
  [
    keycloak.allowRolesMiddleware('ministry_of_health', 'health_authority'),
    keycloak.getUserInfoMiddleware(),
  ],
  asyncMiddleware(async (req, res) => {
    const { hcapUserInfo: user } = req;
    const result = await getAllPhases();

    logger.info({
      action: 'phases_get',
      performed_by: {
        username: user.username,
        id: user.id,
      },
      phases_accessed: result.map((phase) => phase.id),
    });
    return res.json({ data: result });
  })
);

// Create Global Phase: POST
router.post(
  '/',
  [
    keycloak.allowRolesMiddleware('ministry_of_health'),
    keycloak.getUserInfoMiddleware(),
    expressRequestBodyValidator(CreatePhaseSchema),
  ],
  asyncMiddleware(async (req, resp) => {
    if (!FEATURE_PHASE_ALLOCATION) {
      return resp.status(501).send('Phase allocation feature not active');
    }
    try {
      const { body, hcapUserInfo: user } = req;
      const response = await createPhase(body, user);
      logger.info({
        action: 'phase_post',
        performed_by: {
          username: user.username,
          id: user.id,
        },
        globalPhaseId: response.id,
      });
      logger.info(response);
      return resp.status(201).json(response);
    } catch (err) {
      logger.error(err);
      return resp.status(400).send('Failed to create phase');
    }
  })
);

// Update Global Phase: PATCH
router.patch(
  '/:id',
  [
    keycloak.allowRolesMiddleware('ministry_of_health'),
    keycloak.getUserInfoMiddleware(),
    expressRequestBodyValidator(UpdatePhaseSchema),
  ],
  asyncMiddleware(async (req, resp) => {
    if (!FEATURE_PHASE_ALLOCATION) {
      return resp.status(501).send('Phase allocation feature not active');
    }
    try {
      const { body, hcapUserInfo: user } = req;
      const response = await updatePhase(req.params.id, body, user);
      logger.info({
        action: 'phase_patch',
        performed_by: {
          username: user.username,
          id: user.id,
        },
        globalPhaseId: response.id,
      });
      logger.info(response);
      return resp.status(201).json(response);
    } catch (err) {
      logger.error(err);
      return resp.status(400).send('Failed to update phase');
    }
  })
);

module.exports = router;
