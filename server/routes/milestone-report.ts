// Libs
import express from 'express';
import * as csv from 'fast-csv';

// Frameworks
import keycloak from '../keycloak';
import logger from '../logger';
import { asyncMiddleware } from '../error-handler';

// Service
import {
  checkUserRegion,
  getReport,
  getHiredParticipantsReport,
  getHARosMilestonesReport,
  getMohRosMilestonesReport,
} from '../services/reporting';
import { reportType, DEFAULT_REGION_NAME, Role } from '../constants';

// Router
const router = express.Router();

router.use(keycloak.getUserInfoMiddleware());

/**
 * Generate hired milestone report with streaming
 * @param csvStream output stream
 * @param {string} region health region; optional - defaults to ''
 */
const generateHiredReport = async (csvStream, region = DEFAULT_REGION_NAME) => {
  const batchSize = 500;
  let offset = 0;
  let hasMore = true;
  let totalProcessed = 0;

  // Process data in batches
  while (hasMore) {
    // Get one batch of data using pagination
    const results = await getHiredParticipantsReport(region, offset, batchSize);

    // If no results, we're done
    if (results.length === 0) {
      hasMore = false;
      break;
    }

    // Process this batch and write to CSV stream
    for (const result of results) {
      csvStream.write({
        'Participant ID': result.participantId,
        'First Name': result.firstName,
        'Last Name': result.lastName,
        'Employer ID': result.employerId,
        Email: result.email,
        Pathway: result.program,
        'Valid BC Driver License': result.driverLicense,
        Indigenous: result.indigenous,
        Marketing: result.reasonForFindingOut,
        'Work Experience': result.currentOrMostRecentIndustry,
        'MHSU Sector Experience': result.experienceWithMentalHealthOrSubstanceUse,
        'Interested Working In Peer Support Role': result.interestedWorkingPeerSupportRole,
        'Employer Site Region': result.employerRegion,
        'Employer Site ID': result.employerSiteId,
        'Employer Site': result.employerSite,
        'Employer City': result.employerCity,
        'Hire Date': result.hiredDate,
        'Start Date': result.startDate,
        'Withdraw Date': result.withdrawDate,
        'Withdraw Reason': result.withdrawReason,
      });
    }

    // Update counters
    totalProcessed += results.length;
    offset += batchSize;

    // Log progress for large reports
    if (totalProcessed % 2000 === 0) {
      logger.info({
        action: `report-progress`,
        message: `Processed ${totalProcessed} records for hired report`,
      });
    }

    // Add a small delay to prevent CPU hogging
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  logger.info({
    action: `report-complete`,
    message: `Completed hired report with ${totalProcessed} total records`,
  });
};

/**
 * Generate ROS milestone report
 * @param csvStream output stream
 */
const generateRosReport = async (csvStream, region) => {
  const results =
    region === DEFAULT_REGION_NAME
      ? await getMohRosMilestonesReport()
      : await getHARosMilestonesReport(region);
  results.forEach((result) => {
    csvStream.write({
      'Participant ID': result.participantId,
      'First Name': result.firstName,
      'Last Name': result.lastName,
      Pathway: result.program,
      'ROS Start Date': result.startDate,
      'ROS End Date': result.endDate,
      'Start Date at a Site': result.siteStartDate,
      'Position Type': result.positionType,
      'Specific Position Type': result.employmentType,
      'Site of ROS': result.site,
      'Health Region': result.healthRegion,
      'Return of Service Completed': result.rosCompleted,
      'Intends to Continue as HCA/MHAW Following ROS Completion':
        result.remainingInSectorOrRoleOrAnother,
    });
  });
};

/**
 * Template for generating a hired report
 * @param user user data of a person requesting report
 * @param res response
 * @param {any} type type of report
 * @param {string} region health region; optional - defaults to ''
 */
const generateReport = async (user, res, type, region = DEFAULT_REGION_NAME) => {
  const csvStream = csv.format({ headers: true });
  csvStream.pipe(res);

  // Log start of report generation
  logger.info({
    action: `start-report-csv-${type}`,
    performed_by: {
      username: user.username,
      id: user.id,
    },
  });

  switch (type) {
    case reportType.HIRED:
      await generateHiredReport(csvStream, region);
      break;

    case reportType.ROS:
      await generateRosReport(csvStream, region);
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
  [keycloak.allowRolesMiddleware(Role.MinistryOfHealth)],
  asyncMiddleware(async (req, res) => res.status(200).json({ data: await getReport() }))
);

router.get(
  '/csv/hired',
  [keycloak.allowRolesMiddleware(Role.MinistryOfHealth)],
  asyncMiddleware(async (req, res) => {
    const { hcapUserInfo: user } = req;
    res.attachment('report.csv');
    await generateReport(user, res, reportType.HIRED);
  })
);

router.get(
  '/csv/hired/:regionId',
  [keycloak.allowRolesMiddleware(Role.HealthAuthority)],
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
  [keycloak.allowRolesMiddleware(Role.MinistryOfHealth)],
  asyncMiddleware(async (req, res) => {
    const { hcapUserInfo: user } = req;
    res.attachment('report.csv');
    await generateReport(user, res, reportType.ROS);
  })
);

router.get(
  '/csv/ros/:regionId',
  [keycloak.allowRolesMiddleware(Role.HealthAuthority)],
  asyncMiddleware(async (req, res) => {
    const { hcapUserInfo: user, params } = req;
    const { regionId } = params;

    if (!checkUserRegion(user, regionId)) {
      return res.status(403).json({ error: 'User is not permitted to access this region.' });
    }

    res.attachment('report.csv');
    await generateReport(user, res, reportType.ROS, regionId);
    return res.status(200);
  })
);

export default router;
