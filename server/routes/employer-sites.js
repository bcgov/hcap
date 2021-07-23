const express = require('express');
const keycloak = require('../keycloak');
const logger = require('../logger.js');
const { asyncMiddleware, applyMiddleware } = require('../error-handler.js');
const { CreateSiteSchema, EditSiteSchema } = require('../validation');
const { expressRequestBodyValidator } = require('../middleware');
const { saveSingleSite, updateSite } = require('../services/employers');

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
        return res.status(400).send({ siteId: req.body.siteId, status: 'Duplicate' });
      }
      return res.status(400).send(`${excp}`);
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

module.exports = router;
