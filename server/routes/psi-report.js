const express = require('express');
const csv = require('fast-csv');
const keycloak = require('../keycloak');
const logger = require('../logger.js');

const { asyncMiddleware } = require('../error-handler.js');
const { getPSIPaticipantsReport } = require('../services/reporting');
const { DEFAULT_REGION_NAME } = require('../constants');

const router = express.Router();

router.use(keycloak.getUserInfoMiddleware());

// download report for participants attending PSI
router.get(
  '/csv/participants',
  [keycloak.allowRolesMiddleware('ministry_of_health', 'health_authority')],
  asyncMiddleware(async (req, res) => {
    const { hcapUserInfo: user } = req;
    const isMoh = user.isMoH;
    const region = isMoh ? DEFAULT_REGION_NAME : user.regions[0];
    res.attachment('report.csv');

    if (!user) {
      return res.status(403).json({ error: 'User not found.' });
    }

    const csvStream = csv.format({ headers: true });
    csvStream.pipe(res);

    const results = await getPSIPaticipantsReport(region);
    results.forEach((result) => {
      csvStream.write({
        'Participant ID': result.participantId,
        'First Name': result.firstName,
        'Last Name': result.lastName,
        PSI: result.psi,
        Cohort: result.cohort,
        'Cohort Start Date': result.startDate,
        'Cohort End Date': result.endDate,
        'Graduation Status': result.graduation,
        'Failed/Graduated Date': result.graduationDate,
        'Intent to return': result.isReturning,
      });
    });

    logger.info({
      action: `report-csv-participants-psi`,
      performed_by: {
        username: user.username,
        id: user.id,
      },
    });
    csvStream.end();

    return res.status(200);
  })
);

module.exports = router;
