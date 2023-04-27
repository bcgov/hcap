import { addEllipsisMask } from './misc';

export const mapTableRows = (columns, row, button) => {
  // Pull all relevant props from row based on columns constant
  const mappedRow = columns.reduce(
    (accumulator, column) => ({
      ...accumulator,
      [column.id]: addEllipsisMask(row[column.id], 100),
    }),
    {}
  );
  // Add additional props (user ID, button) to row
  return {
    ...mappedRow,
    id: row.id,
    details: button,
  };
};
