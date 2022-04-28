import dayjs from 'dayjs';

export const dateToString = (dateObj) => dayjs(dateObj).format('YYYY/MM/DD');

export const stringToDate = (dateStr) => dayjs(dateStr, 'YYYY/MM/DD');

export const formatCohortDate = (dateStr, { isForm } = { isForm: false }) =>
  dayjs.utc(dateStr).format(isForm ? 'YYYY/MM/DD' : 'DD MMM YYYY');

export const getTodayDate = () => {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();
  return `${yyyy}-${mm}-${dd}`;
};
