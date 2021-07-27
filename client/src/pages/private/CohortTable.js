import React, { useState } from 'react';
import _orderBy from 'lodash/orderBy';
import Grid from '@material-ui/core/Grid';
import { Box } from '@material-ui/core';
import { Table } from '../../components/generic';

const columns = [
  { id: 'cohortName', name: 'Cohort Name' },
  { id: 'startDate', name: 'Start Date' },
  { id: 'endDate', name: 'End Date' },
  { id: 'cohortSize', name: 'Cohort Size' },
  { id: 'remainingSeats', name: 'Remaining Seats' },
];

export default () => {
  const [order, setOrder] = useState('asc');

  // These are dummy values to be replaced
  const rows = [{}, {}];
  const isLoadingData = false;

  const [orderBy, setOrderBy] = useState('cohortSize');

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sort = (array) => _orderBy(array, [orderBy, 'operatorName'], [order]);

  return (
    <Grid
      container
      alignContent='flex-start'
      justify='flex-start'
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
          isLoading={isLoadingData}
          renderCell={(columnId, row) => {
            return row[columnId];
          }}
        />
      </Box>
    </Grid>
  );
};
