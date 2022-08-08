import pick from 'lodash/pick';

import { fetchParticipant, psi, getAllSites } from '../../../services';
import { addYearToDate, dayUtils } from '../../../utils';

// Key Map
export const keyLabelMap = {
  fullName: 'Full Name',
  phoneNumber: 'Phone Number',
  emailAddress: 'Email Address',
  interested: 'Program Interest',
  preferredLocation: 'Preferred Location',
  postalCodeFsa: 'Postal Code FSA',
  cohortName: 'Cohort / PSI',
  postHireStatusLabel: 'Graduation Status',
};

// ===   Functions  ===
// Map Ros Data
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
  if (isInterested === 'yes') return 'Interested';
  if (isInterested === 'no') return 'Withdrawn';
  return isInterested;
};

// Display Data
export const displayData = (inputData) => ({
  ...pick(inputData, Object.keys(keyLabelMap)),
  fullName: `${inputData.firstName} ${inputData.lastName}`,
  interested: getInterestLabel(inputData.interested),
  ros:
    inputData.rosStatus && Object.keys(inputData.rosStatus).length
      ? mapRosData(inputData.rosStatus)
      : null,
});

// Helper
export const fetchData = ({
  setParticipant,
  setActualParticipant,
  setPSIList,
  id,
  setError,
  setDisableAssign,
  setAllSites,
}) => {
  fetchParticipant({ id })
    .then((resp) => {
      setParticipant(displayData(resp));
      setActualParticipant(resp);
      if (
        resp.interested?.toLowerCase() === 'withdrawn' ||
        resp.interested?.toLowerCase() === 'no'
      ) {
        setDisableAssign(true);
        return;
      }

      psi()
        .then((list) => {
          setPSIList(list);
        })
        .catch((err) => {
          setError(`${err}`);
        });
    })
    .catch((err) => {
      setError(`${err}`);
    });

  getAllSites()
    .then((res) => {
      setAllSites(res?.data);
    })
    .catch((err) => {
      setError(`${err}`);
    });
};

// Get Cohort name
export const getCohortName = (cohort) => {
  if (!cohort) return '';
  return `${cohort.cohort_name} / ${cohort.psi?.institute_name}`;
};
