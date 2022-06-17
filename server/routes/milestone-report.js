// Libs
const express = require('express');
const csv = require('fast-csv');

// Frameworks
const keycloak = require('../keycloak');
const logger = require('../logger.js');
const { asyncMiddleware } = require('../error-handler.js');

// Service
const {
  checkUserRegion,
  getReport,
  getHiredParticipantsReport,
  getRosParticipantsReport,
} = require('../services/reporting');
const { reportType, DEFAULT_REGION_NAME } = require('../constants');

// Router
const router = express.Router();

router.use(keycloak.getUserInfoMiddleware());

/**
 * Generate hired milestone report
 * @param csvStream output stream
 * @param {string} region health region; optional - defaults to ''
 */
const generateHiredReport = async (csvStream, region = DEFAULT_REGION_NAME) => {
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
};

/**
 * Generate ROS milestone report
 * @param csvStream output stream
 */
const generateRosReport = async (csvStream) => {
  const results = await getRosParticipantsReport();
  results.forEach((result) => {
    csvStream.write({
      'Participant ID': result.participantId,
      'Confirm HCA': result.isHCA,
      'ROS Start Date': result.startDate,
      'ROS End Date': result.endDate,
      'Start Date at a Site': result.siteStartDate,
      'Site of ROS': result.site,
      'Health Region': result.healthRegion,
    });
  });
};

/**
 * Template for generating a hired report
 * @param user user data of a person requesting report
 * @param res response
 * @param {REPORT_TYPE} type type of report
 * @param {string} region health region; optional - defaults to ''
 */
const generateReport = async (user, res, type, region = DEFAULT_REGION_NAME) => {
  const csvStream = csv.format({ headers: true });
  csvStream.pipe(res);

  switch (type) {
    case reportType.HIRED:
      await generateHiredReport(csvStream, region);
      break;

    case reportType.ROS:
      await generateRosReport(csvStream);
      break;

    default:
      logger.info({
        action: `generate-report-action`,
        performed_by: {
          username: user.username,
          id: user.id,
        },
      });
      break;
  }

  logger.info({
    action: `report-csv-${type}`,
    performed_by: {
      username: user.username,
      id: user.id,
    },
  });
  csvStream.end();
};

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
    await generateReport(user, res, reportType.HIRED);
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
    await generateReport(user, res, reportType.HIRED, regionId);
    return res.status(200);
  })
);

router.get(
  '/csv/ros',
  [keycloak.allowRolesMiddleware('ministry_of_health')],
  asyncMiddleware(async (req, res) => {
    const { hcapUserInfo: user } = req;
    res.attachment('report.csv');
    await generateReport(user, res, reportType.ROS);
  })
);

module.exports = router;
