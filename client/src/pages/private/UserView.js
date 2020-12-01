import React, { useEffect, useState } from 'react';
import _orderBy from 'lodash/orderBy';
import { useHistory } from 'react-router-dom';
import Grid from '@material-ui/core/Grid';
import { Box, Typography } from '@material-ui/core';
import store from 'store';
import { Page, Table, CheckPermissions } from '../../components/generic';

const columns = [
  { id: 'firstName', name: 'First Name' },
  { id: 'lastName', name: 'Last Name' },
  { id: 'username', name: 'Username' },
  { id: 'emailAddress', name: 'Email Address' },
  { id: 'enabled', name: 'Enabled' },
  { id: 'createdAt', name: 'Created' },
];

export default () => {

  const [roles, setRoles] = useState([]);
  const [order, setOrder] = useState('asc');
  const [isLoadingData, setLoadingData] = useState(false);
  const [isLoadingUser, setLoadingUser] = useState(false);
  const [rows, setRows] = useState([]);

  const [orderBy, setOrderBy] = useState(columns[4].id);

  const history = useHistory();

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sort = (array) => _orderBy(array, [orderBy, 'operatorName'], [order]);

  useEffect(() => {

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
    };

    const prettyTableCell = (v) => {
      if (typeof v === 'undefined' || v === null) return '';
      return String(v);
    }

    const getPendingUsers = async () => {
      setLoadingData(true);
      const response = await fetch('/api/v1/pending-users', {
        headers: {
          'Accept': 'application/json',
          'Content-type': 'application/json',
          'Authorization': `Bearer ${store.get('TOKEN')}`,
        },
        method: 'GET',
      });

      if (response.ok) {
        const { data } = await response.json();
        const rows = data.map((row) => {
          return columns.reduce((a, i) => ({
            ...a,
            [i.id]: prettyTableCell(row[i.id]),
          }), {})
        });
        setRows(rows);
      } else {
        setRows([]);
      }

      setLoadingData(false);
    };

    const init = async () => {
      await fetchUserInfo();
      await getPendingUsers();
    };
    init();
  }, [history]);

  return (
    <Page>
      <CheckPermissions isLoading={isLoadingUser} roles={roles} permittedRoles={['ministry_of_health']} renderErrorMessage={true}>
        <Grid container alignContent="center" justify="center" alignItems="center" direction="column">
          <Box pt={4} pb={4} pl={2} pr={2}>
            <Typography variant="subtitle1" gutterBottom>
              Pending Access Requests
            </Typography>
          </Box>
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
