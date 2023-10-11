import pick from 'lodash/pick';
import { addYearToDate, dayUtils } from '../utils';
import { keyLabelMap } from '../constants';

const mapRosData = ({ data = {}, rosSite = {} }) => {
  const { date, startDate } = data;
  const { siteName, healthAuthority } = rosSite;
  return {
    date: dayUtils(date).format('MMM DD, YYYY'),
    endDate: addYearToDate(date).format('MMM DD, YYYY'),
    startDate: startDate ? dayUtils(startDate).format('MMM DD, YYYY') : undefined,
    siteName,
    healthAuthority,
  };
};

const getInterestLabel = (isInterested) => {
  switch (isInterested) {
    case 'yes':
      return 'Interested';
    case 'no':
      return 'Withdrawn';
    default:
      return isInterested;
  }
};

/**
 * Function to make underscore-seperated strings title case with spaces.
 * @param {string} status Status string from DB
 * @returns Title case formatted status
 */
const getStatusLabel = (status) =>
  status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

export const getParticipantPageLabel = (pageName) => {
  switch (pageName) {
    case 'participant':
      return 'Participant';
    case 'cohort-details':
      return 'Cohort';
    default:
      return 'Site View';
  }
};

export const displayParticipantData = (inputData) => ({
  ...pick(inputData, Object.keys(keyLabelMap)),
  program: inputData.program,
  fullName: `${inputData.firstName} ${inputData.lastName}`,
  interested: getInterestLabel(inputData.interested),
  status: getStatusLabel(inputData.status),
  ros:
    inputData.rosStatus && Object.keys(inputData.rosStatus).length
      ? mapRosData(inputData.rosStatus)
      : null,
});
