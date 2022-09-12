const express = require('express');
const keycloak = require('../keycloak');
const logger = require('../logger.js');
const { asyncMiddleware } = require('../error-handler.js');
const { EmployerFormSchema } = require('../validation');
const { getEmployers, getEmployerByID } = require('../services/employers');
const { validate } = require('../validation');
const { dbClient, collections } = require('../db');
const { FEATURE_EMPLOYER_FORM } = require('../services/feature-flags');
// Main router
const router = express.Router();

// Create new employer form
router.post(
  `/`,
  asyncMiddleware(async (req, res) => {
    if (!FEATURE_EMPLOYER_FORM) {
      return res.status(403).send('Employer form is disabled');
    }
    await validate(EmployerFormSchema, req.body);
    const result = await dbClient.db.saveDoc(collections.EMPLOYER_FORMS, req.body);
    logger.info(`Form ${result.id} successfully created.`);
    return res.status(201).json({ id: result.id });
  })
);

// Get employer forms
router.get(
  `/`,
  keycloak.allowRolesMiddleware('health_authority', 'ministry_of_health'),
  keycloak.getUserInfoMiddleware(),
  asyncMiddleware(async (req, res) => {
    const user = req.hcapUserInfo;
    const result = await getEmployers(user);
    return res.json({ data: result });
  })
);

router.get(
  `/:id`,
  keycloak.allowRolesMiddleware('health_authority', 'ministry_of_health'),
  keycloak.getUserInfoMiddleware(),
  asyncMiddleware(async (req, res) => {
    const user = req.hcapUserInfo;
    const [result] = await getEmployerByID(req.params.id);
    logger.info({
      action: 'employer-form_get_details',
      performed_by: {
        username: user.username,
        id: user.id,
        regions: user.regions,
      },
      form_viewed: req.params.id,
    });
    if (user.isHA && !user.regions.includes(result.healthAuthority)) {
      return res.status(403).json({ error: 'you do not have permissions to view this form' });
    }
    return res.json(result);
  })
);

module.exports = router;
