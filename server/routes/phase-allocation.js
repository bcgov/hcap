const express = require('express');
const keycloak = require('../keycloak');
const logger = require('../logger.js');
const { asyncMiddleware } = require('../error-handler.js');
const { CreatePhaseSchema } = require('../validation');
const { expressRequestBodyValidator } = require('../middleware');
const { createGlobalPhase, getAllSitePhases } = require('../services/phase');
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
    const { hcapUserInfo: user } = req;
    const siteId = parseInt(req.params.id, 10);

    // TODO: HCAP-1336 check that user has access to siteId
    if (siteId) {
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
    }
    return res.status(400).send('Invalid site id');
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
      const response = await createGlobalPhase(body, user);
      logger.info({
        action: 'phase-allocation_post',
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
      return resp.status(400).send(`${err}`);
    }
  })
);

module.exports = router;
