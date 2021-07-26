import React, { useEffect, useMemo, useState } from 'react';
import _orderBy from 'lodash/orderBy';
import { useHistory } from 'react-router-dom';
import Grid from '@material-ui/core/Grid';
import { Box, Typography } from '@material-ui/core';
import store from 'store';
import { Table, Button, Dialog, CheckPermissions } from '../../components/generic';
import { NewPSIForm } from '../../components/modal-forms';
import { useLocation } from 'react-router-dom';
import { regionLabelsMap, API_URL } from '../../constants';
import { TableFilter } from '../../components/generic/TableFilter';
import { useToast } from '../../hooks';
import { ToastStatus } from '../../constants';
import { AuthContext } from '../../providers';

const columns = [
  { id: 'institute_name', name: 'Institutes' },
  { id: 'health_authority', name: 'Health Authority' },
  { id: 'available_seats', name: 'Available Seats' },
  { id: 'cohorts', name: 'Cohorts' },
  { id: 'postal_code', name: 'Postal Code' },
  { id: 'addCohort' },
];

export const PSITable = () => {
  const { openToast } = useToast();
  const [order, setOrder] = useState('asc');
  const [isLoadingData, setLoadingData] = useState(false);
  const [rows, setRows] = useState([]);
  const [fetchedRows, setFetchedRows] = useState([]);
  const [activeModalForm, setActiveModalForm] = useState(null);

  const [orderBy, setOrderBy] = useState('institute_name');
  const [healthAuthorities, setHealthAuthorities] = useState([
    'Interior',
    'Fraser',
    'Vancouver Coastal',
    'Vancouver Island',
    'Northern',
    'None',
  ]);
  const { auth } = AuthContext.useAuth();
  const roles = useMemo(() => auth.user?.roles || [], [auth.user]);

  const history = useHistory();
  const location = useLocation();

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const fetchPSIs = async () => {
    setLoadingData(true);
    const response = await fetch(`${API_URL}/api/v1/psi`, {
      headers: { Authorization: `Bearer ${store.get('TOKEN')}` },
      method: 'GET',
    });
    if (response.ok) {
      const data = await response.json();
      const rowsData = data.map((row) => {
        return {
          ...row,
          id: row.id,
          cohorts: row.cohorts === undefined ? 0 : row.cohorts.length,
          available_seats: row.cohorts === undefined ? 0 : row.cohorts.length,
        };
      });
      setFetchedRows(rowsData);
      setRows(rowsData.filter((row) => healthAuthorities.includes(row.health_authority)));
    } else {
      setRows([]);
      setFetchedRows([]);
    }
    setLoadingData(false);
  };

  const handlePSICreate = async (psi) => {
    const response = await fetch(`${API_URL}/api/v1/psi`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${store.get('TOKEN')}`,
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
      body: JSON.stringify(psi),
    });

    if (response.ok) {
      setActiveModalForm(null);
      fetchPSIs();
    } else {
      const error = await response.json();
      if (error.status || error.code) {
        // Closes the menu on duplicate submission
        if (error.code === '23505') {
          setActiveModalForm(null);
        }
        openToast({
          status: ToastStatus.Error,
          message: error.error || response.error || response.statusText || 'Server error',
        });
      }
    }
  };

  useEffect(() => {
    setHealthAuthorities(
      roles.includes('superuser') || roles.includes('ministry_of_health')
        ? Object.values(regionLabelsMap)
        : roles.map((loc) => regionLabelsMap[loc]).filter(Boolean)
    );
  }, [roles]);

  const sort = (array) => _orderBy(array, [orderBy, 'operatorName'], [order]);

  useEffect(() => {
    fetchPSIs();
    // This fetch PSIs is a dependency of this function. This needs to be reworked, but it is outside of the scope of the ticket
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, location]);

  const defaultOnClose = () => {
    setActiveModalForm(null);
  };
  return (
    <>
      <Dialog
        title={`Create New Institute`}
        open={activeModalForm != null}
        onClose={defaultOnClose}
      >
        {activeModalForm === 'new-psi' && (
          <NewPSIForm
            initialValues={{
              instituteName: '',
              healthAuthority: '',
              postalCode: '',
            }}
            onSubmit={(values) => {
              handlePSICreate({
                instituteName: values.instituteName,
                healthAuthority: values.healthAuthority,
                postalCode: values.postalCode,
              });
            }}
            onClose={defaultOnClose}
          />
        )}
      </Dialog>
      <Grid
        container
        alignContent='flex-start'
        justify='flex-start'
        alignItems='center'
        direction='column'
      >
        <Grid
          container
          alignContent='flex-start'
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
                filterField='health_authority'
              />
            </Box>
          </Grid>
          <CheckPermissions roles={roles} permittedRoles={['ministry_of_health']}>
            <Grid container item xs={2} style={{ marginLeft: 'auto', marginRight: 20 }}>
              <Button
                onClick={async () => {
                  setActiveModalForm('new-psi');
                }}
                size='medium'
                text='+ Add PSI'
              />
            </Grid>
          </CheckPermissions>
        </Grid>
        <Box pt={2} pb={2} pl={2} pr={2} width='100%'>
          <Table
            columns={columns}
            order={order}
            orderBy={orderBy}
            onRequestSort={handleRequestSort}
            rows={sort(rows)}
            isLoading={isLoadingData}
            renderCell={(columnId, row) => {
              // TODO: Make instituteName clickable
              if (columnId === 'instituteName') return <a href='/'>{row.instituteName}</a>;
              if (columnId === 'addCohort')
                return (
                  <Button
                    // onClick={() => history.push(Routes.SiteView + `/${row.id}`)}
                    onClick={() => console.log('TODO: Implement Add Cohort')}
                    variant='outlined'
                    size='small'
                    text='+ Add Cohort'
                  />
                );
              return row[columnId];
            }}
          />
        </Box>
      </Grid>
    </>
  );
};
