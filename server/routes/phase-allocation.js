const express = require('express');
const keycloak = require('../keycloak');
const logger = require('../logger.js');
const { asyncMiddleware } = require('../error-handler.js');
const { CreatePhaseSchema } = require('../validation');
const { expressRequestBodyValidator } = require('../middleware');
const { createGlobalPhase } = require('../services/phase');

const router = express.Router();

// Create Global Phase: POST
router.post(
  '/',
  [
    keycloak.allowRolesMiddleware('ministry_of_health'),
    keycloak.getUserInfoMiddleware(),
    expressRequestBodyValidator(CreatePhaseSchema),
  ],
  asyncMiddleware(async (req, resp) => {
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
