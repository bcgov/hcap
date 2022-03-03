import moment from 'moment';

export const dateToString = (dateObj) => moment(dateObj).format('YYYY/MM/DD');

export const stringToDate = (dateStr) => moment(dateStr, 'YYYY/MM/DD');

export const formatCohortDate = (dateStr, { isForm } = { isForm: false }) =>
  moment.utc(dateStr).format(isForm ? 'YYYY/MM/DD' : 'MMM DD, YYYY');

export const getTodayDate = () => {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();
  return `${yyyy}-${mm}-${dd}`;
};
