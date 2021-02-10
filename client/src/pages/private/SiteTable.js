import React, { useEffect, useState } from 'react';
import _orderBy from 'lodash/orderBy';
import { useHistory } from 'react-router-dom';
import Grid from '@material-ui/core/Grid';
import { Box, Typography } from '@material-ui/core';
import store from 'store';
import { Table } from '../../components/generic';
import { useLocation } from 'react-router-dom'
import { regionLabelsMap } from '../../constants';
import { TableFilter } from '../../components/generic/TableFilter';

const columns = [
  { id: 'siteId', name: 'Site ID' },
  { id: 'siteName', name: 'Site Name' },
  { id: 'operatorName', name: 'Operator Name' },
  { id: 'healthAuthority', name: 'Health Authority' },
  { id: 'postalCode', name: 'Postal Code' },
  { id: 'earlyAdopterAllocation', name: 'Phase One Allocation' },
];

export default (props) => {
  const [roles, setRoles] = useState([]);
  const [order, setOrder] = useState('asc');
  const [isLoadingData, setLoadingData] = useState(false);
  const [isPendingRequests, setIsPendingRequests] = useState(true);
  const [rows, setRows] = useState([]);
  const [fetchedRows, setFetchedRows] = useState([]);

  const [orderBy, setOrderBy] = useState(columns[4].id);
  const [healthAuthorities, setHealthAuthorities] = useState([
    'Interior',
    'Fraser',
    'Vancouver Coastal',
    'Vancouver Island',
    'Northern',
    'None',
  ]);

  const history = useHistory();
  const location = useLocation();

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const fetchSites = async () => {
    setLoadingData(true);
    const response = await fetch(`/api/v1/employer-sites`, {
      headers: { 'Authorization': `Bearer ${store.get('TOKEN')}` },
      method: 'GET',
    });

    if (response.ok) {
      const { data } = await response.json();
      console.log(data);
      const rowsData = data.map((row) => {
        // Pull all relevant props from row based on columns constant
        const mappedRow = columns.reduce((accumulator, column) => ({
          ...accumulator,
          [column.id]: row[column.id],
        }), {});
        // Add additional props (user ID, button) to row
        return {
          ...mappedRow,
          id: row.id,
        };
      });
      setFetchedRows(rowsData);
      setIsPendingRequests(rowsData.length > 0);
    } else {
      setRows([]);
      setFetchedRows([]);
      setIsPendingRequests(false);
    }
    setLoadingData(false);
  };

  useEffect(() => {
    setHealthAuthorities(
      (roles.includes("superuser") || roles.includes("ministry_of_health"))
      ? Object.values(regionLabelsMap)
      : roles.map((loc) => regionLabelsMap[loc]).filter(Boolean)
    );
  }, [roles]);

  const sort = (array) => _orderBy(array, [orderBy, 'operatorName'], [order]);

  useEffect(() => {
    const fetchUserInfo = async () => {
      const response = await fetch('/api/v1/user', {
        headers: { 'Authorization': `Bearer ${store.get('TOKEN')}` },
        method: 'GET',
      });

      if (response.ok) {
        const { roles } = await response.json();
        setRoles(roles);
      }
    };

    fetchUserInfo();
    fetchSites();
  }, [history, location]);

  useEffect(() => {
    (props?.sites.length)
      ? setRows(fetchedRows.filter((row) => healthAuthorities.includes(row.healthAuthority) && props.sites.includes(row.id)))
      : setRows(fetchedRows.filter((row) => healthAuthorities.includes(row.healthAuthority)));
  },[healthAuthorities,fetchedRows,props]);

  return (
    <Grid container alignContent="flex-start" justify="flex-start" alignItems="center" direction="column">
      <Grid container alignContent="flex-start" justify="flex-start" alignItems="center" direction="row">
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
      {isPendingRequests && <Box pt={2} pb={2} pl={2} pr={2} width="100%">
        <Table
          columns={columns}
          order={order}
          orderBy={orderBy}
          onRequestSort={handleRequestSort}
          rows={sort(rows)}
          isLoading={isLoadingData}
        />
      </Box>}
    </Grid>
  );
};
