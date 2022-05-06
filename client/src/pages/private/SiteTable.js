import React, { useEffect, useMemo, useState } from 'react';
import _orderBy from 'lodash/orderBy';
import { saveAs } from 'file-saver';
import { useHistory } from 'react-router-dom';
import { Grid, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import store from 'store';

import { Table, Button, Dialog, CheckPermissions } from '../../components/generic';
import { NewSiteForm } from '../../components/modal-forms';
import { useLocation } from 'react-router-dom';
import { Routes, regionLabelsMap, API_URL } from '../../constants';
import { TableFilter } from '../../components/generic/TableFilter';
import { useToast } from '../../hooks';
import { ToastStatus, CreateSiteSchema } from '../../constants';
import { AuthContext } from '../../providers';

const useStyles = makeStyles((theme) => ({
  rootItem: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
  },
  tableItem: {
    paddingTop: theme.spacing(4),
    paddingRight: theme.spacing(2),
    paddingBottom: theme.spacing(4),
    paddingLeft: theme.spacing(2),
  },
  filterLabel: {
    color: theme.palette.gray.dark,
    fontWeight: 700,
  },
}));

const columns = [
  { id: 'siteId', name: 'Site ID' },
  { id: 'siteName', name: 'Site Name' },
  { id: 'operatorName', name: 'Operator Name' },
  { id: 'healthAuthority', name: 'Health Authority' },
  { id: 'postalCode', name: 'Postal Code' },
  { id: 'allocation', name: 'Allocation' },
  { id: 'details' },
];

const SiteFormsDialog = ({ activeForm, onDialogSubmit, onDialogClose }) => {
  const { openToast } = useToast();

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
      onDialogClose();
      await onDialogSubmit();
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

  return (
    <Dialog title='Create Site' open={activeForm != null} onClose={onDialogClose}>
      {activeForm === 'new-site' && (
        <NewSiteForm
          initialValues={{
            siteId: '',
            siteName: '',
            registeredBusinessName: '',
            address: '',
            city: '',
            isRHO: null,
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
              isRHO: values.isRHO,
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
          onClose={onDialogClose}
        />
      )}
    </Dialog>
  );
};

export default () => {
  const classes = useStyles();
  const [activeModalForm, setActiveModalForm] = useState(null);
  const [order, setOrder] = useState('asc');
  const [isLoadingData, setLoadingData] = useState(false);
  const [isPendingRequests, setIsPendingRequests] = useState(true);
  const [rows, setRows] = useState([]);
  const [fetchedRows, setFetchedRows] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [isLoadingReport, setLoadingReport] = useState(false);

  const [orderBy, setOrderBy] = useState('siteName');
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
      setRows(rowsData.filter((row) => healthAuthorities.includes(row.healthAuthority)));
    } else {
      setRows([]);
      setFetchedRows([]);
      setIsPendingRequests(false);
    }
    setLoadingData(false);
  };

  const closeDialog = () => {
    setActiveModalForm(null);
  };

  const generateReportByRegion = async (regionId) => {
    const response = await fetch(`${API_URL}/api/v1/milestone-report/csv/hired/${regionId}`, {
      headers: {
        Authorization: `Bearer ${store.get('TOKEN')}`,
      },
      method: 'GET',
    });

    if (response.ok) {
      const blob = await response.blob();
      saveAs(blob, `report-hired-${regionId}-${new Date().toJSON()}.csv`);
    }
  };

  const downloadHiringReport = async () => {
    setLoadingReport(true);
    for (const region of healthAuthorities) {
      if (region !== 'None') {
        await generateReportByRegion(region);
      }
    }
    setLoadingReport(false);
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
    fetchSites();
    // This fetch sites is a dependency of this function. This needs to be reworked, but it is outside of the scope of the ticket
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, location]);

  return (
    <>
      <SiteFormsDialog
        activeForm={activeModalForm}
        onDialogSubmit={fetchSites}
        onDialogClose={closeDialog}
      />

      <Grid
        container
        alignContent='flex-start'
        justify='flex-start'
        alignItems='center'
        direction='row'
      >
        <Grid className={classes.rootItem} item xs={2}>
          <Typography variant='body1' className={classes.filterLabel} gutterBottom>
            Health Region:
          </Typography>
          <TableFilter
            onFilter={(filteredRows) => setRows(filteredRows)}
            values={healthAuthorities}
            rows={fetchedRows}
            label='Health Authority'
            filterField='healthAuthority'
          />
        </Grid>

        <Grid item xs={8} />

        <Grid className={classes.rootItem} item xs={2}>
          <CheckPermissions roles={roles} permittedRoles={['ministry_of_health']}>
            <Button
              onClick={() => {
                setActiveModalForm('new-site');
              }}
              size='medium'
              text='Create Site'
              startIcon={<AddCircleOutlineIcon />}
            />
          </CheckPermissions>
        </Grid>

        <Grid item xs={8} />

        <Grid className={classes.rootItem} item xs={4}>
          <CheckPermissions
            roles={roles}
            permittedRoles={['health_authority', 'ministry_of_health']}
          >
            <Button
              onClick={downloadHiringReport}
              variant='outlined'
              text='Download Hiring Milestones Report'
              loading={isLoadingReport}
            />
          </CheckPermissions>
        </Grid>

        {isPendingRequests && (
          <Grid className={classes.tableItem} item xs={12}>
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
          </Grid>
        )}
      </Grid>
    </>
  );
};
