import React, { useEffect, useMemo, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import store from 'store';

import { Grid, Typography, MenuItem, Menu, Box } from '@material-ui/core';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import { Table, Button, CheckPermissions } from '../../components/generic';
import { NewSiteDialog, PhaseDialog } from '../../components/modal-forms';

import {
  Routes,
  regionLabelsMap,
  API_URL,
  healthAuthoritiesFilter,
  ToastStatus,
} from '../../constants';
import { TableFilter } from '../../components/generic/TableFilter';
import { useToast } from '../../hooks';
import { handleReportDownloadResult, sortObjects } from '../../utils';
import { AuthContext } from '../../providers';
import { FeatureFlaggedComponent, flagKeys } from '../../services';
import { fetchRegionSiteRows, fetchSiteRows } from '../../services/site';
import { useTableStyles } from '../../components/tables/DataTable';
import { SiteTableAllocation } from './SiteTableAllocation';

const columns = [
  { id: 'siteId', name: 'Site ID' },
  { id: 'siteName', name: 'Site Name' },
  { id: 'operatorName', name: 'Operator Name' },
  { id: 'healthAuthority', name: 'Health Authority' },
  { id: 'city', name: 'City' },
  { id: 'postalCode', name: 'Postal Code' },
  {
    id: 'allocation',
    name: 'Allocation',
    customComponent: (row) => <SiteTableAllocation row={row} />,
  },
  { id: 'details' },
  { id: 'startDate', isHidden: true },
  { id: 'endDate', isHidden: true },
];

export default ({ sites, viewOnly }) => {
  const classes = useTableStyles();
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
  const isHA = roles?.includes('health_authority') || false;

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
    const rowsData = isHA ? await fetchRegionSiteRows(columns) : await fetchSiteRows(columns);

    setFetchedRows(rowsData);
    setRows(rowsData.filter((row) => healthAuthorities.includes(row.healthAuthority)));
    setIsPendingRequests(rowsData.length > 0);
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

  const sort = (array) => sortObjects(array, orderBy, order);

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
    setActiveModalForm('new-phase');
  };

  const handleFormSubmit = async () => {
    closeDialog();
    await fetchSites();
  };

  console.log(fetchSiteRows.length);
  const columnObj = (rowId) => columns.find(({ id }) => id === rowId);
  return (
    <>
      <NewSiteDialog
        open={activeModalForm === 'new-site'}
        onSubmit={handleFormSubmit}
        onClose={closeDialog}
      />

      <PhaseDialog
        open={activeModalForm === 'new-phase'}
        onSubmit={handleFormSubmit}
        onClose={closeDialog}
        isNew={true}
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
                <FeatureFlaggedComponent featureKey={flagKeys.FEATURE_PHASE_ALLOCATION}>
                  <MenuItem onClick={openNewPhaseModal} className={classes.menuItem}>
                    Create new phase
                  </MenuItem>
                </FeatureFlaggedComponent>
                <FeatureFlaggedComponent featureKey={flagKeys.FEATURE_PHASE_ALLOCATION}>
                  <MenuItem
                    onClick={() => history.push(Routes.PhaseView)}
                    className={classes.menuItem}
                  >
                    View phase list
                  </MenuItem>
                </FeatureFlaggedComponent>
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
                if (columnObj(columnId).customComponent)
                  return columnObj(columnId).customComponent(row);
                if (columnObj(columnId).isHidden) return;
                if (columnId === 'details')
                  return (
                    <CheckPermissions
                      roles={roles}
                      permittedRoles={['health_authority', 'ministry_of_health']}
                    >
                      <Button
                        onClick={() => history.push(Routes.SiteView + `/${row.id}`)}
                        variant='outlined'
                        size='small'
                        text='details'
                      />
                    </CheckPermissions>
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
