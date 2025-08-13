import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Grid, Box } from '@mui/material';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { Table, Button, CheckPermissions } from '../../components/generic';
import { NewSiteDialog, PhaseDialog } from '../../components/modal-forms';

import { Routes, regionLabelsMap, healthAuthoritiesFilter, Role } from '../../constants';
import { TableFilter } from '../../components/generic/TableFilter';
import { sortObjects } from '../../utils';
import { AuthContext } from '../../providers';
import { fetchRegionSiteRows, fetchSiteRows } from '../../services/site';
import {
  RootItem,
  TableItem,
  FilterLabel,
  StyledMenu,
  StyledMenuItem,
} from '../../components/tables/DataTable';
import { SiteTableAllocation } from './SiteTableAllocation';
import { SetBulkAllocation } from './SetBulkAllocation';

const columns = [
  { id: 'siteId', name: 'Site ID' },
  { id: 'siteName', name: 'Site Name' },
  { id: 'operatorName', name: 'Operator Name' },
  { id: 'healthAuthority', name: 'Health Authority' },
  { id: 'siteType', name: 'Site Type' },
  { id: 'city', name: 'City' },
  { id: 'postalCode', name: 'Postal Code' },
  {
    id: 'allocation',
    name: 'Allocation(HCA/MHAW)',
    customComponent: (row) => <SiteTableAllocation row={row} />,
  },
  { id: 'details' },
  { id: 'startDate', isHidden: true },
  { id: 'endDate', isHidden: true },
];

export default ({ sites }) => {
  const [activeModalForm, setActiveModalForm] = useState(null);
  const [order, setOrder] = useState('asc');
  const [isLoadingData, setLoadingData] = useState(false);
  const [isPendingRequests, setIsPendingRequests] = useState(true);
  const [selectedSites, setSelectedSites] = useState([]);
  const [rows, setRows] = useState([]);
  const [fetchedRows, setFetchedRows] = useState([]);
  // const [isLoadingReport, setLoadingReport] = useState(false);
  // const [isLoadingRosReport, setLoadingRosReport] = useState(false);
  const [actionMenuAnchorEl, setActionMenuAnchorEl] = React.useState(null);

  const [orderBy, setOrderBy] = useState('siteName');
  const [healthAuthorities, setHealthAuthorities] = useState(healthAuthoritiesFilter);
  const { auth } = AuthContext.useAuth();
  const roles = useMemo(() => auth.user?.roles || [], [auth.user]);
  const isHA = roles?.includes(Role.HealthAuthority) || false;

  const navigate = useNavigate();
  const location = useLocation();

  const isActionMenuOpen = Boolean(actionMenuAnchorEl);

  const handleRequestSort = (_, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const fetchSites = async () => {
    setSelectedSites([]);
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

  useEffect(() => {
    setHealthAuthorities(
      roles.includes(Role.Superuser) || roles.includes(Role.MinistryOfHealth)
        ? Object.values(regionLabelsMap)
        : roles.map((loc) => regionLabelsMap[loc]).filter(Boolean),
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
  }, [location]);

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
        <Grid item xs={2}>
          <RootItem>
            <FilterLabel variant='body1' gutterBottom>
              Health Region:
            </FilterLabel>
            <TableFilter
              onFilter={(filteredRows) => setRows(filteredRows)}
              values={healthAuthorities}
              rows={fetchedRows}
              label='Health Authority'
              filterField='healthAuthority'
            />
          </RootItem>
        </Grid>

        <CheckPermissions roles={roles} permittedRoles={[Role.MinistryOfHealth]}>
          <Grid item xs={7} />
          <Grid item xs={3}>
            <RootItem>
              <Box px={2} display='flex' justifyContent='space-evenly'>
                <SetBulkAllocation sites={selectedSites} handleFormSubmit={handleFormSubmit} />
                <Button
                  onClick={openActionMenu}
                  endIcon={isActionMenuOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  aria-controls='simple-menu'
                  aria-haspopup='true'
                  text='Action'
                  variant='contained'
                  fullWidth={false}
                />
                <StyledMenu
                  id='action-menu'
                  anchorEl={actionMenuAnchorEl}
                  open={Boolean(actionMenuAnchorEl)}
                  onClose={closeActionMenu}
                  getContentAnchorEl={null}
                  anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
                  transformOrigin={{ horizontal: 'left', vertical: 'top' }}
                >
                  <StyledMenuItem onClick={openNewSiteModal}>Create new site</StyledMenuItem>
                  <StyledMenuItem onClick={openNewPhaseModal}>Create new phase</StyledMenuItem>
                  <StyledMenuItem onClick={() => navigate(Routes.PhaseView)}>
                    View phase list
                  </StyledMenuItem>
                </StyledMenu>
              </Box>
            </RootItem>
          </Grid>
        </CheckPermissions>

        {roles.includes(Role.Superuser) && <Grid item xs={8} />}

        {isPendingRequests && (
          <Grid item xs={12}>
            <TableItem>
              <Table
                columns={columns}
                order={order}
                orderBy={orderBy}
                onRequestSort={handleRequestSort}
                rows={sort(rows)}
                isMultiSelect={roles.includes(Role.MinistryOfHealth)}
                selectedRows={selectedSites}
                updateSelectedRows={setSelectedSites}
                isLoading={isLoadingData}
                renderCell={(columnId, row) => {
                  if (columnObj(columnId).customComponent)
                    return columnObj(columnId).customComponent(row);
                  if (columnObj(columnId).isHidden) return;
                  if (columnId === 'details')
                    return (
                      <CheckPermissions
                        roles={roles}
                        permittedRoles={[Role.HealthAuthority, Role.MinistryOfHealth]}
                      >
                        <Button
                          onClick={() => navigate(Routes.SiteView + `/${row.id}`)}
                          variant='outlined'
                          size='small'
                          text='details'
                        />
                      </CheckPermissions>
                    );
                  return row[columnId];
                }}
              />
            </TableItem>
          </Grid>
        )}
      </Grid>
    </>
  );
};
