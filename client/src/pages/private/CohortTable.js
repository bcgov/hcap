import React, { useEffect, useMemo, useState } from 'react';
import _orderBy from 'lodash/orderBy';
import { useHistory } from 'react-router-dom';
import Grid from '@material-ui/core/Grid';
import { Box, Typography } from '@material-ui/core';
import store from 'store';
import { Table, Button, Dialog, CheckPermissions } from '../../components/generic';
import { NewSiteForm } from '../../components/modal-forms';
import { useLocation } from 'react-router-dom';
import { Routes, API_URL } from '../../constants';
import { useToast } from '../../hooks';
import { ToastStatus, CreateSiteSchema } from '../../constants';
import { AuthContext } from '../../providers';

const columns = [
  { id: 'cohortName', name: 'Cohort Name' },
  { id: 'startDate', name: 'Start Date' },
  { id: 'endDate', name: 'End Date' },
  { id: 'cohortSize', name: 'Cohort Size' },
  { id: 'remainingSeats', name: 'Remaining Seats' },
];

export default () => {
  const { openToast } = useToast();
  const [order, setOrder] = useState('asc');
  const [isLoadingData, setLoadingData] = useState(false);
  const [rows, setRows] = useState([]);

  const [orderBy, setOrderBy] = useState(columns[4].id);
  const { auth } = AuthContext.useAuth();
  const roles = useMemo(() => auth.user?.roles || [], [auth.user]);

  const history = useHistory();
  const location = useLocation();

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const fetchSites = async () => {
    setLoadingData(true);
    const response = await fetch(`${API_URL}/api/v1/employer-sites`, {
      headers: { Authorization: `Bearer ${store.get('TOKEN')}` },
      method: 'GET',
    });
    if (response.ok) {
      const { data } = await response.json();
      const rowsData = data.map((row) => {
        return {
          ...row,
          id: row.id,
        };
      });
      setRows(rowsData);
    } else {
      setRows([]);
    }
    setLoadingData(false);
  };

  const handleSiteCreate = async (site) => {
    const response = await fetch(`${API_URL}/api/v1/employer-sites`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${store.get('TOKEN')}`,
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
      body: JSON.stringify(site),
    });

    if (response.ok) {
      fetchSites();
    } else {
      const error = await response.json();
      if (error.status && error.status === 'Duplicate') {
        openToast({ status: ToastStatus.Error, message: 'Duplicate site ID' });
      } else {
        openToast({
          status: ToastStatus.Error,
          message: response.error || response.statusText || 'Server error',
        });
      }
    }
  };

  const sort = (array) => _orderBy(array, [orderBy, 'operatorName'], [order]);

  useEffect(() => {
    fetchSites();
    // This fetch sites is a dependency of this function. This needs to be reworked, but it is outside of the scope of the ticket
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, location]);
  return (
    <Grid
      container
      alignContent='flex-start'
      justify='flex-start'
      alignItems='center'
      direction='column'
    >
      <Box pt={2} pb={2} pl={2} pr={2} width='100%'>
        <Table
          columns={columns}
          order={order}
          orderBy={orderBy}
          onRequestSort={handleRequestSort}
          rows={sort(rows)}
          isLoading={isLoadingData}
          renderCell={(columnId, row) => {
            if (columnId === 'details')
              return (
                <Button
                  onClick={() => history.push(Routes.SiteView + `/${row.id}`)}
                  variant='outlined'
                  size='small'
                  text='details'
                />
              );
            return row[columnId];
          }}
        />
      </Box>
    </Grid>
  );
};
