import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(isBetween);

export const dayUtils = dayjs;

export const dateToString = (dateObj) => dayjs(dateObj).format('YYYY/MM/DD');

export const stringToDate = (dateStr) => dayjs(dateStr, 'YYYY/MM/DD');

export const formatCohortDate = (dateStr, { isForm } = { isForm: false }) =>
  dayjs.utc(dateStr).format(isForm ? 'YYYY/MM/DD' : 'DD MMM YYYY');

export const addYearToDate = (dateObj) => {
  let newDate = dayjs(dateObj).add(1, 'y');
  const oldDate = dayjs(dateObj);
  // check specifically for Feb 29- always a leapyear
  if (oldDate.month() === 1 && oldDate.date() === 29) {
    newDate = newDate.add(1, 'd');
  }
  return newDate;
};

export const getTodayDate = () => {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();
  return `${yyyy}-${mm}-${dd}`;
};
