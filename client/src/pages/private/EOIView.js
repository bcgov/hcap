import React, { useEffect, useState } from 'react';
import _orderBy from 'lodash/orderBy';
import Grid from '@material-ui/core/Grid';
import { Typography } from '@material-ui/core';
import { Page, Table } from '../../components/generic';

export default () => {

  const [order, setOrder] = useState('asc');
  const [isLoading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);

  const columns = [
    { id: 'siteName', name: 'Site Name' },
    { id: 'healthAuthority', name: 'Health Authority' },
    { id: 'operatorName', name: 'Operator Name' },
  ];
  const [orderBy, setOrderBy] = useState(columns[0].id);

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortConfig = () => {
    if (orderBy === 'siteName') {
      return [item => item.siteName.toLowerCase(), 'operatorName'];
    } else if (orderBy === 'healthAuthority') {
      return [item => item.healthAuthority.toLowerCase(), 'operatorName'];
    }
    return [orderBy, 'operatorName'];
  };

  const sort = (array) => _orderBy(array, sortConfig(), [order]);

  const getEOIs = async () => {
    const response = await fetch('/api/v1/employer-form', {
      headers: {
        'Accept': 'application/json',
        'Content-type': 'application/json',
      },
      method: 'GET',
    });

    const result = await response.json();

    console.log(result);
    
  };

  useEffect(() => {
    getEOIs();
  });

  return (
    <Page>
      <Grid container alignContent="center" justify="center" alignItems="center" direction="column">
        <Typography variant="subtitle1" gutterBottom>
          Expressions of Interest
        </Typography>
        <Table
          columns={columns}
          order={order}
          orderBy={orderBy}
          onRequestSort={handleRequestSort}
          rows={sort(rows)}
          isLoading={isLoading}
        />
      </Grid>
    </Page>
  );
};
