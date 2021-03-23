import React, { useEffect, useState } from 'react';
import _orderBy from 'lodash/orderBy';
import { useHistory, useLocation, Redirect } from 'react-router-dom';
import Grid from '@material-ui/core/Grid';
import { Box, Typography } from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';
import { Button, Page, Table, CheckPermissions } from '../../components/generic';
import { Routes } from '../../constants';
import store from 'store';

export default () => {

  const [roles, setRoles] = useState([]);
  const [order, setOrder] = useState('asc');
  const [isLoadingUser, setLoadingUser] = useState(false);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({ duplicates: 0, errors: 0 });
  const [columns] = useState([
    { id: 'id', name: 'ID' },
    { id: 'status', name: 'Status' },
    { id: 'message', name: 'Message' },
  ]);
  const history = useHistory();
  const location = useLocation();
  if (!location.state) return <Redirect to={Routes.ParticipantUpload} />

  const [orderBy, setOrderBy] = useState(columns[0].id);

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortConfig = () => {
    return [orderBy, 'id'];
  };

  const sort = (array) => _orderBy(array, sortConfig(), [order]);

  const fetchUserInfo = async () => {
    setLoadingUser(true);
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/v1/user`, {
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
    fetchUserInfo();
    const insertMissingMessage = (row) => row.message ? row : {...row, message: ''};
    setSummary({
      duplicates: location.state?.results?.filter((x) => x.status === 'Duplicate').length || 0,
      errors: location.state?.results?.filter((x) => x.status === 'Error').length || 0,
    });
    setRows(location.state?.results.map(insertMissingMessage) || []);
  }, [location]);

  return (
    <Page>
      <CheckPermissions isLoading={isLoadingUser} roles={roles} permittedRoles={['maximus']} renderErrorMessage={true}>
        <Grid container alignContent="center" justify="center" alignItems="center" direction="column">
          <Box pt={4} pb={4} pl={2} pr={2}>
            <Typography variant="subtitle1" gutterBottom>
              Participant Upload Results
            </Typography>
          </Box>
          <Alert severity={summary.errors ? 'error' : summary.duplicates ? 'warning' : 'success'}>
            <Typography variant="body2" gutterBottom>
              <b>
                Processed {rows.length} participants. There were {summary.errors} errors and {summary.duplicates} duplicates. See results below.
              </b>
            </Typography>
          </Alert>
          <Box pt={4} pb={4} pl={2} pr={2}>
            <Button
              onClick={() => history.goBack()}
              text="Return to Participant Upload"
            />
          </Box>
          <Box pb={2} pl={2} pr={2} width="100%">
            <Table
              columns={columns}
              order={order}
              orderBy={orderBy}
              onRequestSort={handleRequestSort}
              rows={sort(rows)}
            />
          </Box>
        </Grid>
      </CheckPermissions>
    </Page>
  );
};
