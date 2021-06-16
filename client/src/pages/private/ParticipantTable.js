import React, { useEffect, useMemo, useReducer, useState } from 'react';
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
  defaultTableState,
  ArchiveHiredParticipantSchema,
} from '../../constants';
import { Table, CheckPermissions, Button, Dialog } from '../../components/generic';
import {
  ProspectingForm,
  InterviewingForm,
  RejectedForm,
  HireForm,
  NewParticipantForm,
  EditParticipantForm,
  ArchiveHiredParticipantForm,
} from '../../components/modal-forms';
import { useToast } from '../../hooks';
import { DebounceTextField } from '../../components/generic/DebounceTextField';
import { getDialogTitle, prettifyStatus } from '../../utils';
import moment from 'moment';
import { AuthContext } from '../../providers';

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

const reducer = (state, action) => {
  const { type, key, value } = action;
  let newstate = { ...state };
  switch (type) {
    // Add pagination to a key update
    case 'updateKeyWithPagination':
      newstate.pagination = (prev) => ({
        ...prev,
        currentPage: 0,
      });
      newstate[key] = value;
      return newstate;
    // Update any key in state with the corresponding value
    case 'updateKey':
      newstate[key] = value;
      return newstate;

    // Update a search filter. Applies trimming to text
    case 'updateFilter':
      if (newstate[key]?.trim() === value?.trim()) return state;
      newstate[key] = value ? value.trim() : '';
      newstate.pagination = {
        ...newstate.pagination,
        currentPage: 0,
      };
      return newstate;

    case 'updatePage':
      return {
        ...state,
        pagination: {
          ...newstate.pagination,
          currentPage: value,
        },
      };

    // Updating site selector also updates the order, so this needed its own case
    case 'updateSiteSelector':
      return {
        ...state,
        order: {
          field: 'distance',
          direction: 'asc',
        },
        siteSelector: value,
        pagination: {
          ...newstate.pagination,
          currentPage: 0,
        },
      };
    default:
      return state;
  }
};

export default () => {
  const { openToast } = useToast();
  const [isLoadingData, setLoadingData] = useState(false);
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState(defaultColumns);
  const [hideLastNameAndEmailFilter, setHideLastNameAndEmailFilter] = useState(true);
  const [actionMenuParticipant, setActionMenuParticipant] = useState(null);
  const [anchorElement, setAnchorElement] = useState(false);
  const [activeModalForm, setActiveModalForm] = useState(null);
  const [locations, setLocations] = useState([]);
  const { auth } = AuthContext.useAuth();
  const roles = useMemo(() => auth.user?.roles || [], [auth.user?.roles]);
  const sites = useMemo(() => auth.user?.sites || [], [auth.user?.sites]);
  let hasWithdrawnParticipant = false;

  const [reducerState, dispatch] = useReducer(reducer, defaultTableState);
  const filterData = (data, columns) => {
    hasWithdrawnParticipant = false;
    const mapItemToColumns = (item, columns) => {
      const row = {};

      columns.forEach((column) => {
        row[column.id] = item[column.id];
      });

      return row;
    };

    const filteredRows = [];
    console.log(data);
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
        console.log(row.sitename)
        if (item.statusInfos && item.statusInfos.length > 0) {
          // Handling already_hired and withdrawn status
          const previousStatus = item.statusInfos.find((statusInfo) => statusInfo.data?.previous);
          if (item.statusInfos.find((statusInfo) => statusInfo.status === 'withdrawn')) {
            row.status = [previousStatus?.data.previous || item.statusInfos[0].status, 'withdrawn'];
            hasWithdrawnParticipant = true;
          } else if (item.statusInfos.find((statusInfo) => statusInfo.status === 'already_hired')) {
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
    console.log(filteredRows)
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
        const toasts = makeToasts(firstName, lastName);
        openToast(toasts[statusData?.status === 'already_hired' ? statusData.status : status]);
        setActionMenuParticipant(null);
        setActiveModalForm(null);
        forceReload();
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
      forceReload();
    } else {
      openToast({
        status: ToastStatus.Error,
        message: response.error || response.statusText || 'Server error',
      });
    }
  };

  const forceReload = async () => {
    if (!reducerState.tabValue) return;
    const currentPage = reducerState.pagination?.currentPage || 0;
    setLoadingData(true);
    const { data, pagination } = await fetchParticipants(
      currentPage * pageSize,
      reducerState.locationFilter,
      reducerState.fsaFilter,
      reducerState.lastNameFilter,
      reducerState.emailFilter,
      reducerState.order.field,
      reducerState.order.direction,
      reducerState.siteSelector,
      tabs[reducerState.tabValue].statuses
    );
    dispatch({
      type: 'updateKey',
      key: 'pagination',
      value: {
        total: pagination.total,
        currentPage: currentPage || 0,
      },
    });
    const newRows = filterData(data, columns);
    setRows(newRows);
    setLoadingData(false);
  };
  const submitArchiveRequest = (values)=>{
    console.log(values);
  }

  useEffect(() => {
    const resultColumns = [...defaultColumns];
    const currentPage = reducerState.pagination?.currentPage || 0;
    const fetchUserInfo = async () => {
      if (!reducerState.tabValue) {
        dispatch({
          type: 'updateKeyWithPagination',
          key: 'tabValue',
          value: Object.keys(tabs) // Set selected tab to first tab allowed for role
            .find((key) => tabs[key].roles.some((role) => roles.includes(role))),
        });
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
    };

    const getParticipants = async () => {
      if (!reducerState.tabValue) return;
      setLoadingData(true);
      const { data, pagination } = await fetchParticipants(
        currentPage * pageSize,
        reducerState.locationFilter,
        reducerState.fsaFilter || '',
        reducerState.lastNameFilter || '',
        reducerState.emailFilter || '',
        reducerState.order.field,
        reducerState.order.direction,
        reducerState.siteSelector,
        tabs[reducerState.tabValue].statuses
      );
      dispatch({
        type: 'updateKey',
        key: 'pagination',
        value: {
          total: pagination.total,
          currentPage: currentPage,
        },
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
          ['Available Participants', 'Archived Candidates'].includes(reducerState.tabValue)
        );

        if (reducerState.tabValue !== 'Available Participants')
          oldColumns = oldColumns.filter((column) => column.id !== 'callbackStatus');

        if (
          ['My Candidates', 'Archived Candidates'].includes(reducerState.tabValue) &&
          !oldColumns.find((column) => column.id === 'status')
        ) {
          // Remove statusInfo colum
          oldColumns = oldColumns.filter((column) => column.id !== 'statusInfo');
          return [
            ...oldColumns.slice(0, 3),
            { id: 'status', name: 'Status' },
            ...oldColumns.slice(3),
          ];
        }

        if (reducerState.tabValue === 'Hired Candidates') {
          // Remove existing engage, siteName and status and statusInfo column and force putting back siteName + status
          oldColumns = oldColumns.filter(
            (column) => !['engage', 'siteName', 'status', 'statusInfo'].includes(column.id)
          );
          return [
            ...oldColumns.slice(0, 8),
            { id: 'siteName', name: 'Site Name' },
            ...(hasWithdrawnParticipant ? [{ id: 'status', name: 'Status' }] : []),
            ...oldColumns.slice(8),
            {id: 'archive', name: ''}
          ];
          return result;
        }

        if (!['My Candidates', 'Archived Candidates'].includes(reducerState.tabValue))
          return oldColumns.filter((column) => column.id !== 'status');

        return oldColumns;
      });
    };
    runAsync();
  }, [
    reducerState.pagination?.currentPage,
    reducerState.siteSelector,
    reducerState.emailFilter,
    reducerState.locationFilter,
    reducerState.lastNameFilter,
    reducerState.fsaFilter,
    reducerState.order,
    reducerState.tabValue,
    roles,
    hasWithdrawnParticipant,
  ]);

  const defaultOnClose = () => {
    setActiveModalForm(null);
    setActionMenuParticipant(null);
  };

  const renderCell = (columnId, row) => {
    if (columnId === 'callbackStatus') {
      return row[columnId] ? 'Primed' : 'Available';
    }
    if (columnId === 'status') {
      return prettifyStatus(row[columnId], row.id, reducerState.tabValue, handleEngage);
    }
    if (columnId === 'distance') {
      if (row[columnId] !== null && row[columnId] !== undefined) {
        return `${math.round(row[columnId] / 1000) || '<1'} Km`;
      }
      return 'N/A';
    }
    if (columnId === 'engage') {
      const engage = !row.status.includes('already_hired') && !row.status.includes('withdrawn');
      return (
        engage && (
          <Button
            onClick={(event) => {
              setActionMenuParticipant(row[columnId]);
              setAnchorElement(event.currentTarget);
            }}
            variant='outlined'
            size='small'
            text='Actions'
          />
        )
      );
    }
    if (columnId === 'edit') {
      return (
        <Button
          onClick={async () => {
            // Get data from row.id
            const response = await fetch(`${API_URL}/api/v1/participant?id=${row.id}`, {
              headers: {
                Accept: 'application/json',
                'Content-type': 'application/json',
                Authorization: `Bearer ${store.get('TOKEN')}`,
              },
              method: 'GET',
            });

            const participant = await response.json();
            if (participant[0].postalCode === undefined) {
              participant[0].postalCode = '';
            }
            setActionMenuParticipant(participant[0]);
            setActiveModalForm('edit-participant');
            setAnchorElement(null);
          }}
          variant='outlined'
          size='small'
          text='Edit'
        />
      );
    }
    if (columnId === 'userUpdatedAt') {
      return moment(row.userUpdatedAt).fromNow();
    }
    if(columnId === 'archive'){
      return (        <Button
        onClick={async () => {
          // Get data from row.id
          const response = await fetch(`${API_URL}/api/v1/participant?id=${row.id}`, {
            headers: {
              Accept: 'application/json',
              'Content-type': 'application/json',
              Authorization: `Bearer ${store.get('TOKEN')}`,
            },
            method: 'GET',
          });
          const participant = await response.json();
          setActionMenuParticipant(participant[0]);
          setActiveModalForm('archive');
          setAnchorElement(null);
        }}
        variant='outlined'
        size='small'
        text='Archive'
      />)
    }
    return row[columnId];
  };

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
              forceReload();
              defaultOnClose();
              defaultOnClose();
            }}
            onSubmit={() => {
              defaultOnClose();
              dispatch({ type: 'updateKey', key: 'tabValue', value: 'My Candidates' });
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
              if (values.postalCode && values.postalCode.length > 3) {
                values.postalCodeFsa = values.postalCode.slice(0, 3);
              }
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
                forceReload();
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
        {activeModalForm === 'archive' && (
          <ArchiveHiredParticipantForm
          initialValues ={{
            type:null,
            reason: '',
            status:'',
            endDate:moment().format('YYYY/MM/DD'),
            confirmed:false
          }}
          validationSchema = {ArchiveHiredParticipantSchema}
          onSubmit = {(values)=>{
            console.log(values);
            // handleEngage(actionMenuParticipant.id, 'rejected', values)
          }}
          onClose={defaultOnClose}
          />
        )}
      </Dialog>
      <CheckPermissions
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
                  value={reducerState.locationFilter || ''}
                  disabled={isLoadingData || locations.length === 1}
                  onChange={({ target }) =>
                    dispatch({
                      type: 'updateKeyWithPagination',
                      key: 'locationFilter',
                      value: target.value,
                    })
                  }
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
                  value={reducerState.fsaText}
                  disabled={isLoadingData}
                  onDebounce={(text) =>
                    dispatch({ type: 'updateFilter', key: 'fsaFilter', value: text })
                  }
                  onChange={({ target }) =>
                    dispatch({ type: 'updateKey', key: 'fsaText', value: target.value })
                  }
                  placeholder='Forward Sortation Area'
                />
              </Box>
            </Grid>
            <Grid item>
              <Box pl={2}>
                {!hideLastNameAndEmailFilter && (
                  <DebounceTextField
                    time={1000}
                    variant='filled'
                    fullWidth
                    value={reducerState.lastNameText}
                    disabled={isLoadingData}
                    onDebounce={(text) =>
                      dispatch({ type: 'updateFilter', key: 'lastNameFilter', value: text })
                    }
                    onChange={({ target }) =>
                      dispatch({ type: 'updateKey', key: 'lastNameText', value: target.value })
                    }
                    placeholder='Last Name'
                  />
                )}
              </Box>
            </Grid>
            <Grid item>
              <Box pl={2}>
                {!hideLastNameAndEmailFilter && (
                  <DebounceTextField
                    time={1000}
                    variant='filled'
                    fullWidth
                    value={reducerState.emailText}
                    disabled={isLoadingData}
                    onDebounce={(text) =>
                      dispatch({ type: 'updateFilter', key: 'emailFilter', value: text })
                    }
                    onChange={({ target }) =>
                      dispatch({ type: 'updateKey', key: 'emailText', value: target.value })
                    }
                    placeholder='Email'
                  />
                )}
              </Box>
            </Grid>
            {!roles.includes('ministry_of_health') && (
              <Grid item style={{ marginLeft: 20, paddingBottom: 18 }}>
                <Typography>Site for distance calculation: </Typography>
                <Box>
                  <TextField
                    select
                    fullWidth
                    variant='filled'
                    inputProps={{ displayEmpty: true }}
                    value={reducerState.siteSelector || ''}
                    disabled={isLoadingData}
                    onChange={({ target }) =>
                      dispatch({ type: 'updateSiteSelector', value: target.value })
                    }
                    aria-label='site selector'
                  >
                    {[{ siteName: 'Select Site', siteId: null }, ...sites].map((option, index) => (
                      <MenuItem
                        key={option.siteId}
                        value={index === 0 ? '' : option.siteId}
                        aria-label={option?.siteName}
                      >
                        {option?.siteName}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>
              </Grid>
            )}
            {reducerState.tabValue === 'Hired Candidates' && (
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
            <CustomTabs
              value={reducerState.tabValue || false}
              onChange={(event, property) =>
                dispatch({ type: 'updateKeyWithPagination', key: 'tabValue', value: property })
              }
            >
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
              order={reducerState.order.direction}
              orderBy={reducerState.order.field}
              rowsCount={reducerState.pagination?.total}
              onChangePage={(oldPage, newPage) => dispatch({ type: 'updatePage', value: newPage })}
              rowsPerPage={pageSize}
              currentPage={reducerState.pagination?.currentPage}
              renderCell={renderCell}
              onRequestSort={(event, property) =>
                dispatch({
                  type: 'updateKeyWithPagination',
                  key: 'order',
                  value: {
                    field: property,
                    direction: reducerState.order.direction === 'desc' ? 'asc' : 'desc',
                  },
                })
              }
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
