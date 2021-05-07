import React, { useEffect, useState } from 'react';
import _orderBy from 'lodash/orderBy';
import { useHistory } from 'react-router-dom';
import Grid from '@material-ui/core/Grid';
import { Box, Typography } from '@material-ui/core';
import store from 'store';
import { Table, Button, Dialog, CheckPermissions } from '../../components/generic';
import { NewSiteForm } from '../../components/modal-forms';
import { useLocation } from 'react-router-dom';
import { Routes, regionLabelsMap, API_URL } from '../../constants';
import { TableFilter } from '../../components/generic/TableFilter';
import { useToast } from '../../hooks';
import { ToastStatus, CreateSiteSchema } from '../../constants';

const columns = [
  { id: 'siteId', name: 'Site ID' },
  { id: 'siteName', name: 'Site Name' },
  { id: 'operatorName', name: 'Operator Name' },
  { id: 'healthAuthority', name: 'Health Authority' },
  { id: 'postalCode', name: 'Postal Code' },
  { id: 'allocation', name: 'Allocation' },
  { id: 'details' },
];

export default ({ sites }) => {
  const { openToast } = useToast();
  const [roles, setRoles] = useState([]);
  const [order, setOrder] = useState('asc');
  const [isLoadingData, setLoadingData] = useState(false);
  const [isPendingRequests, setIsPendingRequests] = useState(true);
  const [rows, setRows] = useState([]);
  const [fetchedRows, setFetchedRows] = useState([]);
  const [activeModalForm, setActiveModalForm] = useState(null);

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
    const response = await fetch(`${API_URL}/api/v1/employer-sites`, {
      headers: { Authorization: `Bearer ${store.get('TOKEN')}` },
      method: 'GET',
    });

    if (response.ok) {
      const { data } = await response.json();
      const rowsData = data.map((row) => {
        // Pull all relevant props from row based on columns constant
        const mappedRow = columns.reduce(
          (accumulator, column) => ({
            ...accumulator,
            [column.id]: row[column.id],
          }),
          {}
        );
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
      setActiveModalForm(null);
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

  useEffect(() => {
    setHealthAuthorities(
      roles.includes('superuser') || roles.includes('ministry_of_health')
        ? Object.values(regionLabelsMap)
        : roles.map((loc) => regionLabelsMap[loc]).filter(Boolean)
    );
  }, [roles]);

  const sort = (array) => _orderBy(array, [orderBy, 'operatorName'], [order]);

  useEffect(() => {
    const fetchUserInfo = async () => {
      const response = await fetch(`${API_URL}/api/v1/user`, {
        headers: { Authorization: `Bearer ${store.get('TOKEN')}` },
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
    sites?.length
      ? setRows(
          fetchedRows.filter(
            (row) =>
              healthAuthorities.includes(row.healthAuthority) &&
              sites.map((i) => i.siteId).includes(row.id)
          )
        )
      : setRows(fetchedRows.filter((row) => healthAuthorities.includes(row.healthAuthority)));
  }, [healthAuthorities, fetchedRows, sites]);

  const defaultOnClose = () => {
    setActiveModalForm(null);
  };

  return (
    <>
      <Dialog title={`Create Site`} open={activeModalForm != null} onClose={defaultOnClose}>
        {activeModalForm === 'new-site' && (
          <NewSiteForm
            initialValues={{
              siteId: '',
              siteName: '',
              registeredBusinessName: '',
              address: '',
              city: '',
              postalCode: '',
              healthAuthority: '',
              allocation: '',
              operatorName: '',
              operatorContactFirstName: '',
              operatorContactLastName: '',
              operatorPhone: '',
              operatorEmail: '',
              siteContactFirstName: '',
              siteContactLastName: '',
              siteContactPhone: '',
              siteContactEmail: '',
            }}
            validationSchema={CreateSiteSchema}
            onSubmit={(values) => {
              handleSiteCreate({
                siteId: parseInt(values.siteId),
                siteName: values.siteName,
                registeredBusinessName: values.registeredBusinessName,
                address: values.address,
                city: values.city,
                postalCode: values.postalCode,
                healthAuthority: values.healthAuthority,
                allocation: parseInt(values.allocation),
                operatorName: values.operatorName,
                operatorContactFirstName: values.operatorContactFirstName,
                operatorContactLastName: values.operatorContactLastName,
                operatorPhone: values.operatorPhone,
                operatorEmail: values.operatorEmail,
                siteContactFirstName: values.siteContactFirstName,
                siteContactLastName: values.siteContactLastName,
                siteContactPhone: values.siteContactPhone,
                siteContactEmail: values.siteContactEmail,
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
                filterField='healthAuthority'
              />
            </Box>
          </Grid>
          <CheckPermissions roles={roles} permittedRoles={['ministry_of_health']}>
            <Grid container item xs={2} style={{ marginLeft: 'auto', marginRight: 20 }}>
              <Button
                onClick={async () => {
                  setActiveModalForm('new-site');
                }}
                size='medium'
                text='Create Site'
              />
            </Grid>
          </CheckPermissions>
        </Grid>
        {isPendingRequests && (
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
        )}
      </Grid>
    </>
  );
};
