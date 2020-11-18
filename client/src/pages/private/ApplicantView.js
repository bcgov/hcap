import React, { useEffect, useState } from 'react';
import _orderBy from 'lodash/orderBy';
import { useHistory } from 'react-router-dom';
import Grid from '@material-ui/core/Grid';
import { Box, Typography } from '@material-ui/core';
import store from 'store';
import { Page, Table, CheckPermissions } from '../../components/generic';

export default () => {

  const [roles, setRoles] = useState([]);
  const [order, setOrder] = useState('asc');
  const [isLoadingData, setLoadingData] = useState(false);
  const [isLoadingUser, setLoadingUser] = useState(false);
  const [rows, setRows] = useState([]);
  const [columns] = useState([
    { id: 'id', name: 'ID' },
    { id: 'firstName', name: 'First Name' },
    { id: 'lastName', name: 'Last Name' },
    { id: 'eligibility', name: 'Eligible' },
    { id: 'emailAddress', name: 'Email Address' },
    { id: 'postalCode', name: 'Postal Code' },
    { id: 'phoneNumber', name: 'Phone Number' },
    { id: 'preferredLocation', name: 'Preferred Location' },
  ]);

  const [orderBy, setOrderBy] = useState(columns[0].id);

  const history = useHistory();

  const fetchUserInfo = async () => {
    setLoadingUser(true);
    const response = await fetch('/api/v1/user', {
      headers: {
        'Authorization': `Bearer ${store.get('TOKEN')}`,
      },
      method: 'GET',
    });

    if (response.ok) {
      const { roles } = await response.json();
      setLoadingUser(false);
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
        row.eligibility = row.eligibility ? 'Yes' : 'No';
        rows.push(row);
      });
      return rows;
    }

    const getApplicants = async () => {
      setLoadingData(true);
      const response = await fetch('/api/v1/employees', {
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
      setLoadingData(false);
    };

    getApplicants();
  }, [columns, history]);

  return (
    <Page>
      <CheckPermissions isLoading={isLoadingUser} roles={roles} permittedRoles={['employer', 'health_authority', 'ministry_of_health']} renderErrorMessage={true}>
        <Grid container alignContent="center" justify="center" alignItems="center" direction="column">
          <Box pt={4} pb={4} pl={2} pr={2}>
            <Typography variant="subtitle1" gutterBottom>
              Applicants
            </Typography>
          </Box>
          <Box pb={2} pl={2} pr={2} width="100%">
            <Table
              columns={columns}
              order={order}
              orderBy={orderBy}
              onRequestSort={handleRequestSort}
              rows={sort(rows)}
              isLoading={isLoadingData}
            />
          </Box>
        </Grid>
      </CheckPermissions>
    </Page>
  );
};
