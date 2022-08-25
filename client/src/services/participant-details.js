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

export const getParticipantPageLabel = (pageName) => {
  return pageName === 'participant' ? 'Participant' : 'Site View';
};

export const displayParticipantData = (inputData) => ({
  ...pick(inputData, Object.keys(keyLabelMap)),
  fullName: `${inputData.firstName} ${inputData.lastName}`,
  interested: getInterestLabel(inputData.interested),
  ros:
    inputData.rosStatus && Object.keys(inputData.rosStatus).length
      ? mapRosData(inputData.rosStatus)
      : null,
});
