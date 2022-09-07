import React, { useEffect, useMemo, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import store from 'store';
import _orderBy from 'lodash/orderBy';

import { Grid, Typography, MenuItem, Menu, Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import { Table, Button, Dialog, CheckPermissions } from '../../components/generic';
import { NewSiteForm } from '../../components/modal-forms';
import {
  Routes,
  regionLabelsMap,
  API_URL,
  healthAuthoritiesFilter,
  ToastStatus,
  CreateSiteSchema,
} from '../../constants';
import { TableFilter } from '../../components/generic/TableFilter';
import { useToast } from '../../hooks';
import { handleReportDownloadResult } from '../../utils';
import { AuthContext } from '../../providers';
import { FeatureFlag, flagKeys } from '../../services';

const useStyles = makeStyles((theme) => ({
  rootItem: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
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
  actionMenuPaper: {
    minWidth: '220px',
  },
  menuItem: {
    padding: '.75rem',
    fontSize: '17px',
  },
}));

const columns = [
  { id: 'siteId', name: 'Site ID' },
  { id: 'siteName', name: 'Site Name' },
  { id: 'operatorName', name: 'Operator Name' },
  { id: 'healthAuthority', name: 'Health Authority' },
  { id: 'city', name: 'City' },
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
              ...values,
              siteId: parseInt(values.siteId),
              allocation: parseInt(values.allocation),
            });
          }}
          onClose={onDialogClose}
        />
      )}
    </Dialog>
  );
};

export default ({ sites, viewOnly }) => {
  const classes = useStyles();
  const { openToast } = useToast();
  const [activeModalForm, setActiveModalForm] = useState(null);
  const [order, setOrder] = useState('asc');
  const [isLoadingData, setLoadingData] = useState(false);
  const [isPendingRequests, setIsPendingRequests] = useState(true);
  const [rows, setRows] = useState([]);
  const [fetchedRows, setFetchedRows] = useState([]);
  const [isLoadingReport, setLoadingReport] = useState(false);
  const [isLoadingRosReport, setLoadingRosReport] = useState(false);
  const [actionMenuAnchorEl, setActionMenuAnchorEl] = React.useState(null);

  const [orderBy, setOrderBy] = useState('siteName');
  const [healthAuthorities, setHealthAuthorities] = useState(healthAuthoritiesFilter);
  const { auth } = AuthContext.useAuth();
  const roles = useMemo(() => auth.user?.roles || [], [auth.user]);

  const history = useHistory();
  const location = useLocation();

  const isActionMenuOpen = Boolean(actionMenuAnchorEl);

  const handleRequestSort = (_, property) => {
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

    const downloadRes = await handleReportDownloadResult(
      response,
      `report-hired-${regionId}-${new Date().toJSON()}.csv`
    );
    openToast(downloadRes);
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

  const downloadRosReport = async (regionIds) => {
    if (!regionIds || regionIds.length === 0) {
      openToast({
        status: ToastStatus.Error,
        message: 'Download error: No health region found!',
      });
      return;
    }

    setLoadingRosReport(true);
    const healthRegion = regionIds[0];

    const response = await fetch(`${API_URL}/api/v1/milestone-report/csv/ros/${healthRegion}`, {
      headers: {
        Authorization: `Bearer ${store.get('TOKEN')}`,
      },
      method: 'GET',
    });

    const downloadRes = await handleReportDownloadResult(
      response,
      `return-of-service-milestones-${new Date().toJSON()}.csv`
    );
    openToast(downloadRes);

    setLoadingRosReport(false);
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
    if (sites) {
      setRows(sites);
    } else {
      fetchSites();
    }
    // This fetch sites is a dependency of this function. This needs to be reworked, but it is outside of the scope of the ticket
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, location]);

  const openActionMenu = (event) => {
    setActionMenuAnchorEl(event.currentTarget);
  };

  const closeActionMenu = () => {
    setActionMenuAnchorEl(null);
  };

  const openNewSiteModal = () => {
    closeActionMenu();
    setActiveModalForm('new-site');
  };

  const openNewPhaseModal = () => {
    closeActionMenu();
    // TODO HCAP-1277 setActiveModalForm('new-phase');
  };

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

        <CheckPermissions roles={roles} permittedRoles={['ministry_of_health']}>
          <Grid item xs={8} />
          <Grid className={classes.rootItem} item xs={2}>
            <Box px={2} display='flex' justifyContent='end'>
              <Button
                onClick={openActionMenu}
                endIcon={isActionMenuOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                aria-controls='simple-menu'
                aria-haspopup='true'
                text='Action'
                variant='contained'
                fullWidth={false}
              />
              <Menu
                id='action-menu'
                anchorEl={actionMenuAnchorEl}
                open={Boolean(actionMenuAnchorEl)}
                onClose={closeActionMenu}
                getContentAnchorEl={null}
                anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
                transformOrigin={{ horizontal: 'left', vertical: 'top' }}
                classes={{ paper: classes.actionMenuPaper }}
              >
                <MenuItem onClick={openNewSiteModal} className={classes.menuItem}>
                  Create new site
                </MenuItem>
                <FeatureFlag featureKey={flagKeys.FEATURE_PHASE_ALLOCATION}>
                  <MenuItem onClick={openNewPhaseModal} className={classes.menuItem}>
                    Create new phase
                  </MenuItem>
                </FeatureFlag>
              </Menu>
            </Box>
          </Grid>
        </CheckPermissions>

        {roles.includes('superuser') && <Grid item xs={8} />}

        {!viewOnly && (
          <CheckPermissions roles={roles} permittedRoles={['health_authority']}>
            <Grid item xs={6} />
            <Grid container item xs={4}>
              <Grid className={classes.rootItem} item xs={12}>
                <Button
                  onClick={downloadHiringReport}
                  variant='outlined'
                  text='Download Hiring Milestones Report'
                  loading={isLoadingReport}
                />
              </Grid>

              <Grid className={classes.rootItem} item xs={12}>
                <Button
                  onClick={() => downloadRosReport(healthAuthorities)}
                  variant='outlined'
                  text='Download Return of Service Milestones report'
                  loading={isLoadingRosReport}
                />
              </Grid>
            </Grid>
          </CheckPermissions>
        )}

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
