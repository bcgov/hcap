// Libs
const express = require('express');
const csv = require('fast-csv');

// Frameworks
const keycloak = require('../keycloak');
const logger = require('../logger.js');
const { asyncMiddleware } = require('../error-handler.js');

// Service
const { getReport, getHiredParticipantsReport } = require('../services/reporting');

// Router
const router = express.Router();

router.use(keycloak.allowRolesMiddleware('ministry_of_health'));
router.use(keycloak.getUserInfoMiddleware());

router.get(
  '/',
  asyncMiddleware(async (req, res) => res.status(200).json({ data: await getReport() }))
);

router.get(
  '/csv/hired',
  asyncMiddleware(async (req, res) => {
    const { hcapUserInfo: user } = req;
    res.attachment('report.csv');
    const csvStream = csv.format({ headers: true });
    csvStream.pipe(res);
    const results = await getHiredParticipantsReport();
    results.forEach((result) => {
      csvStream.write({
        'Participant ID': result.participantId,
        FSA: result.participantFsa,
        'Employer ID': result.employerId,
        'Employer Email': result.employerEmail,
        'HCAP Position': result.hcapPosition,
        'Position Type': result.positionType,
        'Position Title': result.positionTitle,
        'Employer Site Region': result.employerRegion,
        'Employer Site': result.employerSite,
        'Start Date': result.startDate,
        'Regional Health Office': result.isRHO,
        'Withdraw Reason': result.withdrawReason,
        'Withdraw Date': result.withdrawDate,
        'Intent To Rehire': result?.rehire,
      });
    });
    logger.info({
      action: 'milestone-report_get_csv_hired',
      performed_by: {
        username: user.username,
        id: user.id,
      },
    });
    csvStream.end();
  })
);

module.exports = router;
