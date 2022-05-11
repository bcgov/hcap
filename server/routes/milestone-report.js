// Libs
const express = require('express');
const csv = require('fast-csv');

// Frameworks
const keycloak = require('../keycloak');
const logger = require('../logger.js');
const { asyncMiddleware } = require('../error-handler.js');

// Service
const {
  getReport,
  getHiredParticipantsReport,
  DEFAULT_REGION_NAME,
} = require('../services/reporting');

// Router
const router = express.Router();

router.use(keycloak.getUserInfoMiddleware());

/**
 * Template for generating a hired report
 * @param user user data of a person requesting report
 * @param res response
 * @param {string} region health region; optional - defaults to ''
 */
const generateMilestoneReport = async (user, res, region = DEFAULT_REGION_NAME) => {
  const csvStream = csv.format({ headers: true });
  csvStream.pipe(res);
  const results = await getHiredParticipantsReport(region);
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
};

/**
 * Validation layer to see if the user has access to requested health region
 * @param user data of a user who accesses the endpoints
 * @param {string} regionId health region
 * @return {boolean} true if the user has access
 */
const checkUserRegion = (user, regionId) => user && user.regions?.includes(regionId);

router.get(
  '/',
  [keycloak.allowRolesMiddleware('ministry_of_health')],
  asyncMiddleware(async (req, res) => res.status(200).json({ data: await getReport() }))
);

router.get(
  '/csv/hired',
  [keycloak.allowRolesMiddleware('ministry_of_health')],
  asyncMiddleware(async (req, res) => {
    const { hcapUserInfo: user } = req;
    res.attachment('report.csv');
    await generateMilestoneReport(user, res);
  })
);

router.get(
  '/csv/hired/:regionId',
  [keycloak.allowRolesMiddleware('health_authority')],
  asyncMiddleware(async (req, res) => {
    const { hcapUserInfo: user, params } = req;
    const { regionId } = params;

    if (!checkUserRegion(user, regionId)) {
      return res.status(403).json({ error: 'User is not permitted to access this region.' });
    }

    res.attachment('report.csv');
    await generateMilestoneReport(user, res, regionId);
    return res.status(200).json({ message: 'Report generated successfully!' });
  })
);

module.exports = router;
