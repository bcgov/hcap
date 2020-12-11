import React, { useEffect, useState } from 'react';
import _orderBy from 'lodash/orderBy';
import { useHistory } from 'react-router-dom';
import Grid from '@material-ui/core/Grid';
import { Box, Typography, TextField, MenuItem } from '@material-ui/core';
import store from 'store';
import { Page, Table, CheckPermissions } from '../../components/generic';

const defaultColumns = [
  { id: 'id', name: 'ID' },
  { id: 'lastName', name: 'Last Name' },
  { id: 'firstName', name: 'First Name' },
  { id: 'postalCodeFsa', name: 'FSA' },
  { id: 'preferredLocation', name: 'Preferred Region(s)' },
  { id: 'nonHCAP', name: 'Non-HCAP' },
];

const sortOrder = [
  'id',
  'lastName',
  'firstName',
  'postalCodeFsa',
  'phoneNumber',
  'emailAddress',
  'preferredLocation',
  'interested',
  'nonHCAP',
  'crcClear',
];

export default () => {

  const [roles, setRoles] = useState([]);
  const [order, setOrder] = useState('asc');
  const [isLoadingData, setLoadingData] = useState(false);
  const [isLoadingUser, setLoadingUser] = useState(false);
  const [rows, setRows] = useState([]);
  const [fetchedRows, setFetchedRows] = useState([]);
  const [columns, setColumns] = useState(defaultColumns);
  const [locationFilter, setLocationFilter] = useState(null);
  const [fsaFilter, setFsaFilter] = useState(null);
  const [locations] = useState([
    'Interior',
    'Fraser',
    'Vancouver Coastal',
    'Vancouver Island',
    'Northern',
  ]);

  const [orderBy, setOrderBy] = useState(columns[0].id);

  const history = useHistory();

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
      row[columnId] = item[columnId] || '';
    });
    return row;
  };

  useEffect(() => { // Filter table
    let filtered = fetchedRows;
    if (locationFilter) filtered = filtered.filter((row) => row.preferredLocation.includes(locationFilter));
    if (fsaFilter) filtered = filtered.filter((row) => row.postalCodeFsa.toUpperCase().startsWith(fsaFilter.toUpperCase()));
    setRows(filtered);
  }, [locationFilter, fsaFilter, fetchedRows]);

  const sort = (array) => _orderBy(array, sortConfig(), [order]);

  useEffect(() => {

    const resultColumns = [...defaultColumns];
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
        const isMoH = roles.includes('ministry_of_health');
        const isSuperUser = roles.includes('superuser');
        if (isMoH || isSuperUser) {
          resultColumns.push(
            { id: 'interested', name: 'Interest' },
            { id: 'crcClear', name: 'CRC Clear' },
          );
        }

        if (!isMoH) {
          resultColumns.push(
            { id: 'phoneNumber', name: 'Phone Number' },
            { id: 'emailAddress', name: 'Email Address' },
          )
        }

        resultColumns.sort((colum1, column2) => (sortOrder.indexOf(colum1.id) - sortOrder.indexOf(column2.id)));

        setColumns(resultColumns);
      }
    };

    const filterData = (data) => {
      const rows = [];
      data.forEach(dataItem => {

        const item = { ...dataItem };
        if (!item.emailAddress) {
          item.emailAddress = '***@***.***';
        }

        if (!item.phoneNumber) {
          item.phoneNumber = '(***) ***-****';
        }

        const row = mapItemToColumns(item, resultColumns);
        rows.push(row);
      });
      return rows;
    }

    const getParticipants = async () => {
      setLoadingData(true);
      const response = await fetch('/api/v1/participants', {
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

    const init = async () => {
      await fetchUserInfo();
      await getParticipants();
    };
    init();
  }, [history]);

  return (
    <Page>
      <CheckPermissions isLoading={isLoadingUser} roles={roles} permittedRoles={['employer', 'health_authority', 'ministry_of_health']} renderErrorMessage={true}>
        <Grid container alignContent="center" justify="center" alignItems="center" direction="column">
          <Box pt={4} pb={4} pl={2} pr={2}>
            <Typography variant="subtitle1" gutterBottom>
              Participants
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
              <Box>
                <TextField
                  select
                  fullWidth
                  variant="filled"
                  inputProps={{ displayEmpty: true }}
                  value={locationFilter || ''}
                  onChange={({ target }) => setLocationFilter(target.value)}
                >
                  <MenuItem value="">Preferred Location</MenuItem>
                  {locations.map((option) => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </TextField>
              </Box>
            </Grid>
            <Grid item>
              <Box pl={2}>
                <TextField
                  variant="filled"
                  fullWidth
                  value={fsaFilter || ''}
                  onChange={({ target }) => setFsaFilter(target.value)}
                  placeholder='Forward Sortation Area'
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
