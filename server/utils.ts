import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';

export { default as dayjs } from 'dayjs';

dayjs.extend(relativeTime);
dayjs.extend(utc);

export const addYearToDate = (dateObj) => {
  let newDate = dayjs(dateObj).add(1, 'y');
  const oldDate = dayjs(dateObj);
  // check specifically for Feb 29- always a leapyear
  if (oldDate.month() === 1 && oldDate.date() === 29) {
    newDate = newDate.add(1, 'd');
  }
  return newDate;
};

export const patchObject = (source, patchableFields) =>
  Object.keys(source).reduce(
    (target, key) => (patchableFields.includes(key) ? { ...target, [key]: source[key] } : target),
    {}
  );

export const sanitize = (input) => encodeURIComponent(input.toString().trim());
