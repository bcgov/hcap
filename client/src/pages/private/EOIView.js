import React, { useEffect, useState } from 'react';
import _orderBy from 'lodash/orderBy';
import { useHistory } from 'react-router-dom';
import Grid from '@material-ui/core/Grid';
import { Box, Typography } from '@material-ui/core';
import store from 'store';
import { Button, Page, Table, CheckPermissions } from '../../components/generic';
import { Routes } from '../../constants';
import { TableFilter } from '../../components/generic/TableFilter';

export default () => {

  const [roles, setRoles] = useState([]);
  const [order, setOrder] = useState('asc');
  const [isLoadingData, setLoadingData] = useState(false);
  const [isLoadingUser, setLoadingUser] = useState(false);
  const [fetchedRows, setFetchedRows] = useState([]);
  const [rows, setRows] = useState([]);
  const [columns] = useState([
    { id: 'id', name: 'ID' },
    { id: 'siteName', name: 'Site Name' },
    { id: 'siteType', name: 'Site Type' },
    { id: 'emailAddress', name: 'Email Address' },
    { id: 'address', name: 'Address' },
    { id: 'healthAuthority', name: 'Health Authority' },
    { id: 'operatorName', name: 'Operator Name' },
    { id: 'details' },
  ]);
  const [healthAuthorities, setHealthAuthorities ] = useState([
    'Interior',
    'Fraser',
    'Vancouver Coastal',
    'Vancouver Island',
    'Northern',
    'None',
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

  useEffect(() => {
    const locationRoles = {
      region_interior: 'Interior',
      region_fraser: 'Fraser',
      region_vancouver_coastal: 'Vancouver Coastal',
      region_vancouver_island: 'Vancouver Island',
      region_northern: 'Northern',
      none: 'None'
    };

    setHealthAuthorities(
      (roles.includes("superuser") || roles.includes("ministry_of_health"))
      ? Object.values(locationRoles) 
      : roles.map((loc) => locationRoles[loc]).filter(Boolean)
    );
  }, [roles]);

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
      setLoadingData(true);
      const response = await fetch('/api/v1/employer-form', {
        headers: {
          'Accept': 'application/json',
          'Content-type': 'application/json',
          'Authorization': `Bearer ${store.get('TOKEN')}`,
        },
        method: 'GET',
      });

      let rows = [];
      if (response.ok) {
        const { data } = await response.json();
        rows = filterData(data);
      }

      setFetchedRows(rows);
      setRows(rows);
      setLoadingData(false);
    };

    getEOIs();
  }, [columns, history]);

  return (
    <Page>
      <CheckPermissions isLoading={isLoadingUser} roles={roles} permittedRoles={['health_authority', 'ministry_of_health']} renderErrorMessage={true}>
        <Grid container alignContent="center" justify="center" alignItems="center" direction="column">
          <Box pt={4} pb={4} pl={2} pr={2}>
            <Typography variant="subtitle1" gutterBottom>
              Employer Expressions of Interest
            </Typography>
          </Box>
          <Grid container alignContent="center" justify="flex-start" alignItems="center" direction="row">
            <Grid item>
              <Box pl={2} pr={2} pt={1}>
                <Typography variant="body1" gutterBottom>
                  Filter:
              </Typography>
              </Box>
            </Grid>
            <Grid item>
              <Box minWidth={180}>
                <TableFilter
                  onFilter={(filteredRows) => setRows(filteredRows)}
                  values={healthAuthorities}
                  rows={fetchedRows}
                  label="Health Authority"
                  filterField="healthAuthority"
                />
              </Box>
            </Grid>
          </Grid>
          <Box pt={2} pb={2} pl={2} pr={2} width="100%">
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
