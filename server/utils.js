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

const sanitize = (input) => encodeURIComponent(input.trim());

module.exports = { createRows, verifyHeaders, patchObject, sanitize };
