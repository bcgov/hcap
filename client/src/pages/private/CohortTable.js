import React, { useEffect, useState } from 'react';
import _orderBy from 'lodash/orderBy';
import Grid from '@mui/material/Grid';
import { Box } from '@mui/material';
import { Table } from '../../components/generic';

const columns = [
  { id: 'cohort_name', name: 'Cohort Name' },
  { id: 'start_date', name: 'Start Date' },
  { id: 'end_date', name: 'End Date' },
  { id: 'cohort_size', name: 'Cohort Size' },
  { id: 'remaining_seats', name: 'Remaining Seats' },
];

export default ({ cohorts }) => {
  const [order, setOrder] = useState('asc');
  const [rows, setRows] = useState(cohorts);

  const [orderBy, setOrderBy] = useState('start_date');

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sort = (array) => _orderBy(array, [orderBy, 'operatorName'], [order]);

  useEffect(() => {
    setRows(cohorts);
  }, [cohorts]);

  return (
    <Grid
      container
      alignContent='flex-start'
      justifyContent='flex-start'
      alignItems='center'
      direction='column'
    >
      <Box pt={2} pb={2} pl={2} pr={2} width='100%'>
        <Table
          columns={columns}
          order={order}
          orderBy={orderBy}
          onRequestSort={handleRequestSort}
          rows={sort(rows)}
          isLoading={false}
          renderCell={(columnId, row) => {
            if (columnId === 'start_date' || columnId === 'end_date') {
              // Parses the relevant section of the date string
              return new Date(row[columnId]).toUTCString().split(' ').slice(1, 4).join(' ');
            }

            if (columnId === 'remaining_seats')
              return row['cohort_size'] - row['participants'].length;

            return row[columnId];
          }}
        />
      </Box>
    </Grid>
  );
};
