import React, { useState } from 'react';
import { MenuItem, TextField } from '@material-ui/core';

export const TableFilter = ({ onFilter, values, label, rows }) => {

  const [selectedValue, setValue] = useState();

  const handleFilter = (element) => {
    const { value } = element.target;
    setValue(value);
    const isValidOption = values.includes(value);
    if (isValidOption) {
      onFilter(rows.filter(row => row.preferredLocation.includes(value)));
    } else {
      onFilter(rows);
    }
  };

  return (<TextField
    select
    fullWidth
    variant="filled"
    inputProps={{ displayEmpty: true }}
    value={selectedValue || ''}
    onChange={handleFilter}
  >
    <MenuItem value="">{label}</MenuItem>
    {values.map((option) => (
      <MenuItem key={option} value={option}>{option}</MenuItem>
    ))}
  </TextField>);
};