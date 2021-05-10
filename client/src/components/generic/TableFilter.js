import React, { useState, useEffect } from 'react';
import { MenuItem, TextField } from '@material-ui/core';

export const TableFilter = ({ onFilter, values, label, rows, filterField }) => {
  const [selectedValue, setValue] = useState();

  const handleFilter = (element) => {
    const { value } = element.target;
    setValue(value);
    const isValidOption = values.includes(value);
    if (isValidOption) {
      value === 'None'
        ? onFilter(rows.filter((row) => !row[filterField]))
        : onFilter(rows.filter((row) => row[filterField].includes(value)));
    } else {
      onFilter(rows);
    }
  };

  useEffect(() => {
    if (values.length === 1) setValue(values[0]);
  }, [values]);

  return (
    <TextField
      select
      fullWidth
      variant='filled'
      inputProps={{ displayEmpty: true }}
      disabled={values.length === 1}
      value={selectedValue || ''}
      onChange={handleFilter}
      aria-label={label + ' filter'}
    >
      {values.length > 1 && <MenuItem value=''>{label}</MenuItem>}
      {values.map((option) => (
        <MenuItem key={option} value={option} aria-label={option}>
          {option}
        </MenuItem>
      ))}
    </TextField>
  );
};
