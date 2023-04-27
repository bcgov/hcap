import React, { useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import Grid from '@material-ui/core/Grid';
import { Box, Typography } from '@material-ui/core';
import store from 'store';
import { Button, Page, Table, CheckPermissions } from '../../components/generic';
import { Routes, regionLabelsMap, API_URL, healthAuthoritiesFilter, Role } from '../../constants';
import { TableFilter } from '../../components/generic/TableFilter';
import { AuthContext } from '../../providers';
import { sortObjects } from '../../utils';

export default () => {
  const [order, setOrder] = useState('asc');
  const [isLoadingData, setLoadingData] = useState(false);
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
  const [healthAuthorities, setHealthAuthorities] = useState(healthAuthoritiesFilter);
  const { auth } = AuthContext.useAuth();
  const roles = useMemo(() => auth.user?.roles || [], [auth.user?.roles]);

  const [orderBy, setOrderBy] = useState(columns[0].id);

  const history = useHistory();

  useEffect(() => {
    setHealthAuthorities(
      roles.includes(Role.Superuser) || roles.includes(Role.MinistryOfHealth)
        ? Object.values(regionLabelsMap)
        : roles.map((loc) => regionLabelsMap[loc]).filter(Boolean)
    );
  }, [roles]);

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const mapItemToColumns = (item, columns) => {
    const row = {};
    columns
      .map((column) => column.id)
      .forEach((columnId) => {
        for (const [key, value] of Object.entries(item)) {
          if (key === columnId) {
            row[key] = value || '';
          }
        }
      });
    return row;
  };

  const sort = (array) => sortObjects(array, orderBy, order);

  useEffect(() => {
    const filterData = (data) => {
      const rows = [];
      data.forEach((item) => {
        const row = mapItemToColumns(item, columns);
        row.details = (
          <Button
            onClick={() => history.push(`${Routes.EOIView}/details/${item.id}`)}
            variant='outlined'
            size='small'
            text='Details'
          />
        );
        rows.push(row);
      });
      return rows;
    };

    const getEOIs = async () => {
      setLoadingData(true);
      const response = await fetch(`${API_URL}/api/v1/employer-form`, {
        headers: {
          Accept: 'application/json',
          'Content-type': 'application/json',
          Authorization: `Bearer ${store.get('TOKEN')}`,
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
      <CheckPermissions
        permittedRoles={[Role.HealthAuthority, Role.MinistryOfHealth]}
        renderErrorMessage={true}
      >
        <Grid
          container
          alignContent='center'
          justify='center'
          alignItems='center'
          direction='column'
        >
          <Box pt={4} pb={4} pl={2} pr={2}>
            <Typography variant='subtitle1' gutterBottom>
              Employer Expressions of Interest
            </Typography>
          </Box>
          <Grid
            container
            alignContent='center'
            justify='flex-start'
            alignItems='center'
            direction='row'
          >
            <Grid item>
              <Box pl={2} pr={2} pt={1}>
                <Typography variant='body1' gutterBottom>
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
                  label='Health Authority'
                  filterField='healthAuthority'
                />
              </Box>
            </Grid>
          </Grid>
          <Box pt={2} pb={2} pl={2} pr={2} width='100%'>
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
