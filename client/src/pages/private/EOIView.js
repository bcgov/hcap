import React, { useEffect, useState } from 'react';
import _orderBy from 'lodash/orderBy';
import { useHistory } from 'react-router-dom';
import Grid from '@material-ui/core/Grid';
import { Box, Typography } from '@material-ui/core';
import store from 'store';
import { Button, Page, Table, CheckPermissions } from '../../components/generic';
import { Routes } from '../../constants';

export default () => {

  const [roles, setRoles] = useState([]);
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
    {}, //Details
  ]);

  const [orderBy, setOrderBy] = useState(columns[0].id);

  const history = useHistory();

  const fetchUserInfo = async () => {
    const response = await fetch('/api/v1/user', {
      headers: {
        'Authorization': `Bearer ${store.get('TOKEN')}`,
      },
      method: 'GET',
    });

    if (response.ok) {
      const { roles } = await response.json();
      setRoles(roles);
    }
  }

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

  const mapItemToColumns = (item, columns) => {
    const row = {};
    columns.map(column => column.id).forEach(columnId => {
      for (const [key, value] of Object.entries(item)) {
        if (key === columnId) {
          row[key] = value || '';
        }
      }
    });
    return row;
  }

  const sort = (array) => _orderBy(array, sortConfig(), [order]);

  useEffect(() => {
    fetchUserInfo();

    const filterData = (data) => {
      const rows = [];
      data.forEach(item => {
        const row = mapItemToColumns(item, columns);
        row.details = (
          <Button
            onClick={() => history.push(Routes.EOIViewDetails, { item })}
            variant="outlined"
            size="small"
            text="Details"
          />
        );
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
  }, [columns, history]);

  return (
    <Page>
      <CheckPermissions roles={roles} permittedRoles={['employer', 'health_authority', 'ministry_of_health']} renderMessage={true}>
        <Grid container alignContent="center" justify="center" alignItems="center" direction="column">
          <Box pt={4} pb={4} pl={2} pr={2}>
            <Typography variant="subtitle1" gutterBottom>
              Employer Expressions of Interest
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
      </CheckPermissions>
    </Page>
  );
};
