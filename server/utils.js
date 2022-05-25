const dayjs = require('dayjs');
const relativeTime = require('dayjs/plugin/relativeTime');
const utc = require('dayjs/plugin/utc');

dayjs.extend(relativeTime);
dayjs.extend(utc);

const addYearToDate = (dateObj) => {
  let newDate = dayjs(dateObj).add(1, 'y');
  const oldDate = dayjs(dateObj);
  // check specifically for Feb 29- always a leapyear
  if (oldDate.month() === 1 && oldDate.date() === 29) {
    newDate = newDate.add(1, 'd');
  }
  return newDate;
};

const verifyHeaders = (dataRows, columnMap) => {
  const headers = dataRows[0];
  Object.keys(columnMap).forEach((columName) => {
    if (!headers.includes(columName)) {
      throw new Error(`Missing header "${columName}" in spreadsheet`);
    }
  });
};

const createRows = (dataRows, columnMap) => {
  const headers = dataRows[0];
  const rowSize = dataRows.length;
  const rows = [];
  dataRows.slice(1, rowSize).forEach((dataRow) => {
    if (dataRow.length === 0) return; // ignore empty rows
    const row = {};
    headers.forEach((header, index) => {
      if (!columnMap[header]) return;

      row[columnMap[header]] = dataRow[index];
    });
    rows.push(row);
  });
  return rows;
};

const patchObject = (source, patchableFields) =>
  Object.keys(source).reduce(
    (target, key) => (patchableFields.includes(key) ? { ...target, [key]: source[key] } : target),
    {}
  );

const sanitize = (input) => encodeURIComponent(input.toString().trim());

module.exports = { createRows, verifyHeaders, patchObject, sanitize, addYearToDate, dayjs };
