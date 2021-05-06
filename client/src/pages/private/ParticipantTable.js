import React, { useEffect, useReducer, useState } from 'react';
import Grid from '@material-ui/core/Grid';
import { withStyles } from '@material-ui/core/styles';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import math from 'lodash/math';
import { Box, Typography, TextField, Menu, MenuItem } from '@material-ui/core';
import store from 'store';
import {
  ToastStatus,
  InterviewingFormSchema,
  RejectedFormSchema,
  HireFormSchema,
  ExternalHiredParticipantSchema,
  EditParticipantFormSchema,
  regionLabelsMap,
  API_URL,
  sortOrder,
  pageSize,
  defaultColumns,
  tabs,
  makeToasts,
  defaultTableState
} from '../../constants';
import { Table, CheckPermissions, Button, Dialog } from '../../components/generic';
import {
  ProspectingForm,
  InterviewingForm,
  RejectedForm,
  HireForm,
  NewParticipantForm,
  EditParticipantForm,
} from '../../components/modal-forms';
import { useToast } from '../../hooks';
import { DebounceTextField } from '../../components/generic/DebounceTextField';
import { getDialogTitle, prettifyStatus } from '../../utils';
import moment from 'moment';


const CustomTabs = withStyles((theme) => ({
  root: {
    borderBottom: `1px solid ${theme.palette.gray.secondary}`,
    marginBottom: theme.spacing(2),
  },
  indicator: {
    backgroundColor: theme.palette.highlight.primary,
  },
}))(Tabs);

const CustomTab = withStyles((theme) => ({
  root: {
    textTransform: 'none',
    minWidth: 72,
    fontWeight: theme.typography.fontWeightRegular,
    marginRight: theme.spacing(4),
    '&:hover': {
      color: theme.palette.highlight.primary,
      opacity: 1,
    },
    '&$selected': {
      color: theme.palette.highlight.secondary,
      fontWeight: theme.typography.fontWeightMedium,
    },
    '&:focus': {
      color: theme.palette.highlight.primary,
    },
  },
  selected: {},
}))((props) => <Tab disableRipple {...props} />);

export default () => {
  const { openToast } = useToast();
  const [roles, setRoles] = useState([]);
  const [sites, setSites] = useState([]);
  const [order, setOrder] = useState({ field: 'id', direction: 'asc' });
  const [isLoadingData, setLoadingData] = useState(false);
  const [isLoadingUser, setLoadingUser] = useState(false);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 0 });
  const [columns, setColumns] = useState(defaultColumns);
  const [locationFilter, setLocationFilter] = useState(null);
  const [siteSelector, setSiteSelector] = useState(null);
  const [hideLastNameAndEmailFilter, setHideLastNameAndEmailFilter] = useState(true);
  const [actionMenuParticipant, setActionMenuParticipant] = useState(null);
  const [anchorElement, setAnchorElement] = useState(false);
  const [activeModalForm, setActiveModalForm] = useState(null);
  const [tabValue, setTabValue] = useState(null);
  const [locations, setLocations] = useState([]);

  const textReducer = (state,action)=>{
    const {type,key,value} = action
    let newstate = {...state};
    switch (type){
      case 'updateText':
        newstate[key] = value;
        return newstate;
      case 'updateFilter': 
        if(state[key]?.trim() === value?.trim()) return state;
        setPagination(prev => ({
          ...prev,
          currentPage: 0,
        }));
        newstate[key] = value? value.trim() : '';
        return newstate;
      default:
        return state;
    }
  }
  const [textState, dispatch ] = useReducer(textReducer,defaultTableState);
  const handleRequestSort = (event, property) => {
    setOrder({
      field: property,
      direction: order.direction === 'desc' ? 'asc' : 'desc',
    });
    setPagination((prev) => ({
      ...prev,
      currentPage: 0,
    }));
  };


  const handleTabChange = (event, newValue) => {
    setPagination((prev) => ({
      ...prev,
      currentPage: 0,
    }));
    setTabValue(newValue);
  };

  const handleLocationFilter = (value) => {
    setLocationFilter(value);
    setPagination((prev) => ({
      ...prev,
      currentPage: 0,
    }));
  };

  const handleSiteSelector = (value) => {
    setSiteSelector(value);
    setOrder({
      field: 'distance',
      direction: 'asc',
    });
    setPagination((prev) => ({
      ...prev,
      currentPage: 0,
    }));
  };

  const filterData = (data, columns) => {
    const mapItemToColumns = (item, columns) => {
      const row = {};

      columns.forEach((column) => {
        row[column.id] = item[column.id];
      });

      return row;
    };

    const filteredRows = [];
    data &&
      data.forEach((dataItem) => {
        const item = { ...dataItem };
        if (!item.emailAddress) {
          item.emailAddress = emailAddressMask;
        }

        if (!item.phoneNumber) {
          item.phoneNumber = phoneNumberMask;
        }

        const row = mapItemToColumns(item, columns);

        row.engage = item;
        row.siteName = item?.statusInfos?.[0].data?.siteName;

        if (item.statusInfos && item.statusInfos.length > 0) {
          if (item.statusInfos.find((statusInfo) => statusInfo.status === 'already_hired')) {
            const previousStatus = item.statusInfos.find((statusInfo) => statusInfo.data?.previous);
            row.status = [
              previousStatus?.data.previous || item.statusInfos[0].status,
              'already_hired',
            ];
          } else {
            row.status = [item.statusInfos[0].status];
          }
        } else {
          row.status = ['open'];
        }

        row.engage.status = row.status[0];

        filteredRows.push(row);
      });
    return filteredRows;
  };

  const fetchParticipants = async (
    offset,
    regionFilter,
    fsaFilter,
    lastNameFilter,
    emailFilter,
    sortField,
    sortDirection,
    siteSelector,
    statusFilters
  ) => {
    const queries = [
      sortField && `sortField=${sortField}`,
      offset && `offset=${offset}`,
      sortDirection && `sortDirection=${sortDirection}`,
      regionFilter && `regionFilter=${regionFilter}`,
      fsaFilter && `fsaFilter=${fsaFilter}`,
      lastNameFilter && `lastNameFilter=${lastNameFilter}`,
      siteSelector && `siteSelector=${siteSelector}`,
      emailFilter && `emailFilter=${emailFilter}`,
      ...(statusFilters && statusFilters.map((status) => `statusFilters[]=${status}`)),
    ]
      .filter((item) => item)
      .join('&');

    const response = await fetch(`${API_URL}/api/v1/participants?${queries}`, {
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
        Authorization: `Bearer ${store.get('TOKEN')}`,
      },
      method: 'GET',
    });

    if (response.ok) {
      return response.json();
    }
  };

  const emailAddressMask = '***@***.***';
  const phoneNumberMask = '(***) ***-****';

  const handleEngage = async (participantId, status, additional = {}) => {
    const response = await fetch(`${API_URL}/api/v1/employer-actions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${store.get('TOKEN')}`,
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
      body: JSON.stringify({ participantId, status, data: additional }),
    });

    if (response.ok) {
      const { data: statusData } = await response.json();

      if (status === 'prospecting') {
        // Modal appears after submitting
        setActiveModalForm('prospecting');
      } else {
        const index = rows.findIndex((row) => row.id === participantId);
        const { firstName, lastName } = rows[index];
        const toasts = makeToasts(firstName,lastName,ToastStatus);
        openToast(toasts[statusData?.status === 'already_hired' ? statusData.status : status]);
        setActionMenuParticipant(null);
        setActiveModalForm(null);
        forceReload(pagination);
      }
    } else {
      openToast({
        status: ToastStatus.Error,
        message: response.error || response.statusText || 'Server error',
      });
    }
  };

  const handleExternalHire = async (participantInfo) => {
    const response = await fetch(`${API_URL}/api/v1/new-hired-participant`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${store.get('TOKEN')}`,
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
      body: JSON.stringify(participantInfo),
    });

    if (response.ok) {
      setActionMenuParticipant(null);
      setActiveModalForm(null);
      forceReload(pagination);
    } else {
      openToast({
        status: ToastStatus.Error,
        message: response.error || response.statusText || 'Server error',
      });
    }
  };

  const forceReload = async (currentPagination) => {
    if (!tabValue) return;
    const currentPage = currentPagination.currentPage;
    setLoadingData(true);
    const { data, pagination } = await fetchParticipants(
      currentPage * pageSize,
      locationFilter,
      textState.fsaFilter,
      textState.lastNameFilter,
      textState.emailFilter,
      order.field,
      order.direction,
      siteSelector,
      tabs[tabValue].statuses
    );

    setPagination({
      total: pagination.total,
      currentPage: currentPage,
    });

    const newRows = filterData(data, columns);
    setRows(newRows);
    setLoadingData(false);
  };

  useEffect(() => {
    const resultColumns = [...defaultColumns];
    const currentPage = pagination.currentPage;

    const fetchUserInfo = async () => {
      setLoadingUser(true);
      const response = await fetch(`${API_URL}/api/v1/user`, {
        headers: {
          Authorization: `Bearer ${store.get('TOKEN')}`,
        },
        method: 'GET',
      });

      if (response.ok) {
        const { roles, sites } = await response.json();
        setLoadingUser(false);
        setSites(sites);
        setRoles(roles);
        if (!tabValue) {
          setTabValue(
            Object.keys(tabs) // Set selected tab to first tab allowed for role
              .find((key) => tabs[key].roles.some((role) => roles.includes(role)))
          );
        }
        const isMoH = roles.includes('ministry_of_health');
        const isSuperUser = roles.includes('superuser');
        if (isMoH || isSuperUser) {
          resultColumns.push(
            { id: 'interested', name: 'Interest' },
            { id: 'crcClear', name: 'CRC Clear' },
            { id: 'statusInfo', name: 'Status' },
            { id: 'edit' }
          );
        }

        // Either returns all location roles or a role mapping with a Boolean filter removes all undefined values
        const regions = Object.values(regionLabelsMap).filter((value) => value !== 'None');
        setLocations(
          isMoH || isSuperUser ? regions : roles.map((loc) => regionLabelsMap[loc]).filter(Boolean)
        );

        if (!isMoH) {
          resultColumns.push(
            { id: 'phoneNumber', name: 'Phone Number' },
            { id: 'emailAddress', name: 'Email Address' },
            { id: 'distance', name: 'Site Distance' }
          );
        }

        if (!isMoH && !isSuperUser) {
          resultColumns.push({ id: 'engage' });
        }

        resultColumns.sort(
          (colum1, column2) => sortOrder.indexOf(colum1.id) - sortOrder.indexOf(column2.id)
        );

        setColumns(resultColumns);
      }
    };

    const getParticipants = async () => {
      if (!tabValue) return;
      setLoadingData(true);
      const { data, pagination } = await fetchParticipants(
        currentPage * pageSize,
        locationFilter,
        textState.fsaFilter || '',
        textState.lastNameFilter || '',
        textState.emailFilter || '',
        order.field,
        order.direction,
        siteSelector,
        tabs[tabValue].statuses
      );

      setPagination({
        total: pagination.total,
        currentPage: currentPage,
      });
      const newRows = filterData(data, resultColumns);
      setRows(newRows);
      setLoadingData(false);
    };

    const runAsync = async () => {
      await fetchUserInfo();
      await getParticipants();

      setColumns((oldColumns) => {
        setHideLastNameAndEmailFilter(
          ['Available Participants', 'Archived Candidates'].includes(tabValue)
        );

        if (tabValue !== 'Available Participants')
          oldColumns = oldColumns.filter((column) => column.id !== 'callbackStatus');

        if (
          ['My Candidates', 'Archived Candidates'].includes(tabValue) &&
          !oldColumns.find((column) => column.id === 'status')
        )
          return [
            ...oldColumns.slice(0, 3),
            { id: 'status', name: 'Status' },
            ...oldColumns.slice(3),
          ];

        if (tabValue === 'Hired Candidates') {
          oldColumns = oldColumns.filter((column) => column.id !== 'engage');
          return [
            ...oldColumns.slice(0, 8),
            { id: 'siteName', name: 'Site Name' },
            ...oldColumns.slice(8),
          ];
        }

        if (!['My Candidates', 'Archived Candidates'].includes(tabValue))
          return oldColumns.filter((column) => column.id !== 'status');

        return oldColumns;
      });
    };
    runAsync();
  }, [pagination.currentPage, locationFilter, siteSelector, textState.emailFilter, textState.locationFilter, textState.lastNameFilter,  textState.fsaFilter, order, tabValue]);

  const handlePageChange = (oldPage, newPage) => {
    setPagination((pagination) => ({ ...pagination, currentPage: newPage }));
  };

  const defaultOnClose = () => {
    setActiveModalForm(null);
    setActionMenuParticipant(null);
  };

  const renderCell = (columnId, row) => {
    if (columnId === 'callbackStatus') {
      return row[columnId] ? 'Primed' : 'Available';
    }
    if (columnId === 'status') {
      return prettifyStatus(row[columnId], row.id, tabValue, handleEngage);
    }
    if (columnId === 'distance') {
      if (row[columnId] !== null && row[columnId] !== undefined) {
        return `${math.round(row[columnId]/1000) || '<1'} Km`;
      }
      return 'N/A';
    }
    if (columnId === 'engage') {
      return !row.status.includes('already_hired') && <Button
        onClick={(event) => {
          setActionMenuParticipant(row[columnId]);
          setAnchorElement(event.currentTarget);
        }}
        variant="outlined"
        size="small"
        text="Actions"
      />
    }
    if (columnId === 'edit') {
      return <Button
        onClick={async () => {
          // Get data from row.id
          const response = await fetch(`${API_URL}/api/v1/participant?id=${row.id}`, {
            headers: {
              'Accept': 'application/json',
              'Content-type': 'application/json',
              'Authorization': `Bearer ${store.get('TOKEN')}`,
            },
            method: 'GET',
          });
  
          const participant = await response.json();
  
          setActionMenuParticipant(participant[0]);
          setActiveModalForm('edit-participant');
          setAnchorElement(null);
        }}
        variant="outlined"
        size="small"
        text="Edit"
      />
    }
    if (columnId === 'userUpdatedAt') {
      return moment(row.userUpdatedAt).fromNow();
    }
    return row[columnId];
  }

  return (
    <>
      <Dialog
        title={getDialogTitle(activeModalForm)}
        open={activeModalForm != null}
        onClose={defaultOnClose}
      >
        {activeModalForm === 'prospecting' && (
          <ProspectingForm
            name={`${actionMenuParticipant.firstName} ${actionMenuParticipant.lastName}`}
            onClose={() => {
              forceReload(pagination);
              defaultOnClose();
            }}
            onSubmit={() => {
              defaultOnClose();
              handleTabChange(null, 'My Candidates');
            }}
          />
        )}

        {activeModalForm === 'interviewing' && (
          <InterviewingForm
            initialValues={{ contactedDate: '' }}
            validationSchema={InterviewingFormSchema}
            onSubmit={(values) => {
              handleEngage(actionMenuParticipant.id, 'interviewing', {
                contacted_at: values.contactedDate,
              });
            }}
            onClose={defaultOnClose}
          />
        )}

        {activeModalForm === 'rejected' && (
          <RejectedForm
            initialValues={{ contactedDate: '' }}
            validationSchema={RejectedFormSchema}
            onSubmit={(values) => {
              handleEngage(actionMenuParticipant.id, 'rejected', {
                final_status: values.finalStatus,
              });
            }}
            onClose={defaultOnClose}
          />
        )}

        {activeModalForm === 'hired' && (
          <HireForm
            sites={sites}
            initialValues={{
              nonHcapOpportunity: false,
              positionTitle: '',
              positionType: '',
              hiredDate: '',
              startDate: '',
              site: '',
              acknowledge: false,
            }}
            validationSchema={HireFormSchema}
            onSubmit={(values) => {
              handleEngage(actionMenuParticipant.id, 'hired', {
                nonHcapOpportunity: values.nonHcapOpportunity,
                positionTitle: values.positionTitle,
                positionType: values.positionType,
                hiredDate: values.hiredDate,
                startDate: values.startDate,
                site: values.site,
              });
            }}
            onClose={defaultOnClose}
          />
        )}
        {activeModalForm === 'edit-participant' && (
          <EditParticipantForm
            initialValues={{
              ...actionMenuParticipant,
            }}
            validationSchema={EditParticipantFormSchema}
            onSubmit={async (values) => {
              if (values.phoneNumber && Number.isInteger(values.phoneNumber))
                values.phoneNumber = values.phoneNumber.toString();
              const history = {
                timestamp: new Date(),
                changes: [],
              };
              Object.keys(values).forEach((key) => {
                if (values[key] !== actionMenuParticipant[key]) {
                  history.changes.push({
                    field: key,
                    from: actionMenuParticipant[key],
                    to: values[key],
                  });
                }
              });
              values.history = actionMenuParticipant.history
                ? [history, ...actionMenuParticipant.history]
                : [history];
              const response = await fetch(`${API_URL}/api/v1/participant`, {
                method: 'PATCH',
                headers: {
                  Authorization: `Bearer ${store.get('TOKEN')}`,
                  Accept: 'application/json',
                  'Content-type': 'application/json',
                },
                body: JSON.stringify(values),
              });

              if (response.ok) {
                forceReload(pagination);
                defaultOnClose();
              }
            }}
            onClose={defaultOnClose}
          />
        )}
        {activeModalForm === 'new-participant' && (
          <NewParticipantForm
            sites={sites}
            initialValues={{
              firstName: '',
              lastName: '',
              phoneNumber: '',
              emailAddress: '',
              origin: '',
              otherOrigin: '',
              hcapOpportunity: true,
              contactedDate: '',
              hiredDate: '',
              startDate: '',
              site: '',
              acknowledge: false,
            }}
            validationSchema={ExternalHiredParticipantSchema}
            onSubmit={(values) => {
              handleExternalHire({
                firstName: values.firstName,
                lastName: values.lastName,
                phoneNumber: values.phoneNumber,
                emailAddress: values.emailAddress,
                origin: values.origin,
                otherOrigin: values.otherOrigin,
                hcapOpportunity: values.hcapOpportunity,
                contactedDate: values.contactedDate,
                hiredDate: values.hiredDate,
                startDate: values.startDate,
                site: values.site,
                acknowledge: values.acknowledge,
              });
            }}
            onClose={defaultOnClose}
          />
        )}
      </Dialog>
      <CheckPermissions
        isLoading={isLoadingUser}
        roles={roles}
        permittedRoles={['employer', 'health_authority', 'ministry_of_health']}
        renderErrorMessage={true}
      >
        <Grid
          container
          alignContent='center'
          justify='center'
          alignItems='center'
          direction='column'
        >
          <Grid
            container
            alignContent='center'
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
              <Box>
                <TextField
                  select
                  fullWidth
                  variant='filled'
                  inputProps={{ displayEmpty: true }}
                  value={locationFilter || ''}
                  disabled={isLoadingData || locations.length === 1}
                  onChange={({ target }) => handleLocationFilter(target.value)}
                  aria-label='location filter'
                >
                  {locations.length === 1 ? (
                    <MenuItem value=''>{locations[0]}</MenuItem>
                  ) : (
                    ['Preferred Location', ...locations].map((option, index) => (
                      <MenuItem key={option} value={index === 0 ? '' : option} aria-label={option}>
                        {option}
                      </MenuItem>
                    ))
                  )}
                </TextField>
              </Box>
            </Grid>
            <Grid item>
              <Box pl={2}>
                <DebounceTextField
                  time={1000}
                  variant='filled'
                  fullWidth
                  value={textState.fsaText}
                  disabled={isLoadingData}
                  onDebounce={(text) => dispatch({type:'updateFilter',key:'fsaFilter', value:text})}
                  onChange={({ target }) => dispatch({type:'updateText',key:'fsaText',  value:target.value})}
                  placeholder='Forward Sortation Area'
                />
              </Box>
            </Grid>
            <Grid item>
              <Box pl={2}>
                {!hideLastNameAndEmailFilter && <DebounceTextField
                  time={1000}
                  variant="filled"
                  fullWidth
                  value={textState.lastNameText}
                  disabled={isLoadingData}
                  onDebounce={(text) => dispatch({type:'updateFilter',key:'lastNameFilter', value:text})}
                  onChange={({ target }) => dispatch({type:'updateText',key:'lastNameText',  value:target.value})}
                  placeholder='Last Name'
                />}
              </Box>
            </Grid>
            <Grid item>
              <Box pl={2}>
                {!hideLastNameAndEmailFilter && <DebounceTextField
                  time={1000}
                  variant="filled"
                  fullWidth
                  value={textState.emailText}
                  disabled={isLoadingData}
                  onDebounce={(text) => dispatch({type:'updateFilter',key:'emailFilter', value:text})}
                  onChange={({ target }) => dispatch({type:'updateText',key:'emailNameText',  value:target.value})}
                  placeholder='Email'
                />}
              </Box>
            </Grid>
            <Grid item style={{ 'marginLeft': 20 }}>
              <Typography>Site for distance calculation: </Typography>
              <Box>
                <TextField
                  select
                  fullWidth
                  variant="filled"
                  inputProps={{ displayEmpty: true }}
                  value={siteSelector || ''}
                  disabled={isLoadingData}
                  onChange={({ target }) => handleSiteSelector(target.value)}
                  aria-label="site selector"
                >
                  {
                      [{siteName:'Select Site', siteId: null}, ...sites].map((option, index) => (
                        <MenuItem key={option.siteId} value={index === 0 ? '' : option.siteId} aria-label={option.siteName}>{option.siteName}</MenuItem>
                      ))
                  }
                </TextField>
              </Box>
            </Grid>
            {!roles.includes('ministry_of_health') && (
              <Grid item style={{ marginLeft: 20 }}>
                <Typography>Site for distance calculation: </Typography>
                <Box>
                  <TextField
                    select
                    fullWidth
                    variant='filled'
                    inputProps={{ displayEmpty: true }}
                    value={siteSelector || ''}
                    disabled={isLoadingData}
                    onChange={({ target }) => handleSiteSelector(target.value)}
                    aria-label='site selector'
                  >
                    {[{ siteName: 'Select Site', siteId: null }, ...sites].map((option, index) => (
                      <MenuItem
                        key={option.siteId}
                        value={index === 0 ? '' : option.siteId}
                        aria-label={option.siteName}
                      >
                        {option.siteName}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>
              </Grid>
            )}
            {tabValue === 'Hired Candidates' && (
              <Grid container item xs={2} style={{ marginLeft: 'auto', marginRight: 20 }}>
                <Button
                  onClick={() => setActiveModalForm('new-participant')}
                  text='Add Non-Portal Hire'
                  size='medium'
                />
              </Grid>
            )}
          </Grid>
          <Box pt={2} pb={2} pl={2} pr={2} width='100%'>
            <CustomTabs value={tabValue || false} onChange={handleTabChange}>
              {
                Object.keys(tabs)
                  .filter((key) => roles.some((role) => tabs[key].roles.includes(role))) // Only display tabs for user role
                  .map((key) => (
                    <CustomTab key={key} label={key} value={key} disabled={isLoadingData} />
                  )) // Tab component with tab name as value
              }
            </CustomTabs>
            <Table
              columns={columns}
              order={order.direction}
              orderBy={order.field}
              rowsCount={pagination.total}
              onChangePage={handlePageChange}
              rowsPerPage={pageSize}
              currentPage={pagination.currentPage}
              renderCell={renderCell}
              onRequestSort={handleRequestSort}
              rows={rows}
              isLoading={isLoadingData}
            />
          </Box>
        </Grid>
        {!roles.includes('ministry_of_health') && !roles.includes('superuser') && (
          <Menu
            keepMounted
            open={actionMenuParticipant != null && activeModalForm == null}
            anchorEl={anchorElement}
            onClose={() => setActionMenuParticipant(null)}
          >
            {actionMenuParticipant?.status === 'open' && (
              <MenuItem onClick={() => handleEngage(actionMenuParticipant.id, 'prospecting')}>
                Engage
              </MenuItem>
            )}
            {actionMenuParticipant?.status === 'prospecting' && (
              <MenuItem onClick={() => setActiveModalForm('interviewing')}>Interviewing</MenuItem>
            )}
            {actionMenuParticipant?.status === 'interviewing' && (
              <MenuItem onClick={() => handleEngage(actionMenuParticipant.id, 'offer_made')}>
                Offer Made
              </MenuItem>
            )}
            {actionMenuParticipant?.status === 'offer_made' && (
              <MenuItem onClick={() => setActiveModalForm('hired')}>Hire</MenuItem>
            )}
            {['prospecting', 'interviewing', 'offer_made'].includes(
              actionMenuParticipant?.status
            ) && <MenuItem onClick={() => setActiveModalForm('rejected')}>Archive</MenuItem>}
            {actionMenuParticipant?.status === 'rejected' && (
              <MenuItem onClick={() => handleEngage(actionMenuParticipant.id, 'prospecting')}>
                Re-engage
              </MenuItem>
            )}
          </Menu>
        )}
      </CheckPermissions>
    </>
  );
};
