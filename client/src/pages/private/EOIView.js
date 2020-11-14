import React, { useEffect, useState } from 'react';
import _orderBy from 'lodash/orderBy';
import Grid from '@material-ui/core/Grid';
import { Box, Typography } from '@material-ui/core';
import store from 'store';
import { Page, Table } from '../../components/generic';

export default () => {

  const [order, setOrder] = useState('asc');
  const [isLoading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [columns] = useState([
    { id: 'id', name: 'ID' },
    { id: 'siteName', name: 'Site Name' },
    { id: 'siteType', name: 'Site Type' },
    { id: 'emailAddress', name: 'Email Address' },
    { id: 'address', name: 'Address' },
    { id: 'healthAuthority', name: 'Health Authority' },
    { id: 'operatorName', name: 'Operator Name' },
  ]);

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

  useEffect(() => {
    const filterData = (data) => {
      const rows = [];
      data.forEach(item => {
        const row = {};
        columns.map(column => column.id).forEach(columnId => {
          for (const [key, value] of Object.entries(item)) {
            if (key === columnId) {
              row[key] = value || '';
            }
          }
        });
        rows.push(row);
      });
      return rows;
    }

    const getEOIs = async () => {
      setLoading(true);
      const response = await fetch('/api/v1/employer-form', {
        headers: {
          'Accept': 'application/json',
          'Content-type': 'application/json',
          'Authorization': `Bearer ${store.get('TOKEN')}`,
        },
        method: 'GET',
      });

      const { data } = await response.json();
      const rows = filterData(data);
      setRows(rows);
      setLoading(false);
    };

    getEOIs();
  }, [columns]);

  return (
    <Page>
      <Grid container alignContent="center" justify="center" alignItems="center" direction="column">
        <Box pt={4} pb={4} pl={2} pr={2}>
          <Typography variant="subtitle1" gutterBottom>
            Expressions of Interest
          </Typography>
        </Box>
        <Box pb={2} pl={2} pr={2} width="100%">
          <Table
            columns={columns}
            order={order}
            orderBy={orderBy}
            onRequestSort={handleRequestSort}
            rows={sort(rows)}
            isLoading={isLoading}
          />
        </Box>
      </Grid>
    </Page>
  );
};
