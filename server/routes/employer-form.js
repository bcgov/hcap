const express = require('express');
const keycloak = require('../keycloak');
const logger = require('../logger.js');
const { asyncMiddleware } = require('../error-handler.js');
const { EmployerFormSchema } = require('../validation');
const { getEmployers, getEmployerByID } = require('../services/employers');
const { validate } = require('../validation');
const { dbClient, collections } = require('../db');
// Main router
const router = express.Router();

// Create new employer form
router.post(
  `/`,
  asyncMiddleware(async (req, res) => {
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

function add(numbers) {
  let result = 0;
  const parts = numbers.split(',');
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < parts.length; i++) {
    const integer = parseInt(parts[i], 10);
    // eslint-disable-next-line no-restricted-globals
    if (!isNaN(integer)) {
      if (integer >= 0) {
        if (integer <= 1000) {
          result += integer;
        }
      }
    }
  }

  return result;
}

// Get employer forms
router.get(
  `/`,
  keycloak.allowRolesMiddleware('health_authority', 'ministry_of_health'),
  keycloak.getUserInfoMiddleware(),
  asyncMiddleware(async (req, res) => {
    const user = req.hcapUserInfo;
    const result = await getEmployers(user);
    return res.json({ data: add('10,11'), result });
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
