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
  pageSize,
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
import { AuthContext, ParticipantsContext } from '../../providers';

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
      newstate.pagination = {
        ...newstate,
        currentPage: 0,
      };
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

const filterData = (data, columns) => {
  const emailAddressMask = '***@***.***';
  const phoneNumberMask = '(***) ***-****';

  const mapItemToColumns = (item, columns) => {
    const row = {};

    columns.forEach((column) => {
      row[column.id] = item[column.id];
    });

    return row;
  };

  const filteredRows = [];

  data?.forEach((dataItem) => {
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
      // Handling already_hired and withdrawn status
      const previousStatus = item.statusInfos.find((statusInfo) => statusInfo.data?.previous);
      if (item.statusInfos.find((statusInfo) => statusInfo.status === 'withdrawn')) {
        row.status = [previousStatus?.data.previous || item.statusInfos[0].status, 'withdrawn'];
      } else if (item.statusInfos.find((statusInfo) => statusInfo.status === 'already_hired')) {
        row.status = [previousStatus?.data.previous || item.statusInfos[0].status, 'already_hired'];
      } else {
        row.status = [item.statusInfos[0].status];
      }
    } else if (item.progressStats) {
      row.status = ['open', ...Object.keys(item.progressStats).filter((key) => key === 'archived')];
    } else {
      row.status = ['open'];
    }

    row.engage.status = row.status[0];

    filteredRows.push(row);
  });
  return filteredRows;
};

export default () => {
  const { openToast } = useToast();
  const [isLoadingData, setLoadingData] = useState(false);
  const [rows, setRows] = useState([]);
  const [hideLastNameAndEmailFilter, setHideLastNameAndEmailFilter] = useState(true);
  const [actionMenuParticipant, setActionMenuParticipant] = useState(null);
  const [anchorElement, setAnchorElement] = useState(null);
  const [activeModalForm, setActiveModalForm] = useState(null);
  const [locations, setLocations] = useState([]);
  const {
    state: { columns, tabs, selectedTab, selectedTabStatuses },
    dispatch: participantsDispatch,
  } = ParticipantsContext.useParticipantsContext();
  const { auth } = AuthContext.useAuth();
  const roles = useMemo(() => auth.user?.roles || [], [auth.user?.roles]);
  const sites = useMemo(() => auth.user?.sites || [], [auth.user?.sites]);

  const [reducerState, dispatch] = useReducer(reducer, defaultTableState);

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
    if (!columns) return;
    if (!selectedTab) return;
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
      selectedTabStatuses
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

  useEffect(() => {
    setHideLastNameAndEmailFilter(
      ['Available Participants', 'Archived Candidates'].includes(selectedTab)
    );
  }, [selectedTab]);

  useEffect(() => {
    const isMoH = roles.includes('ministry_of_health');
    const isSuperUser = roles.includes('superuser');

    // Either returns all location roles or a role mapping with a Boolean filter removes all undefined values
    const regions = Object.values(regionLabelsMap).filter((value) => value !== 'None');
    setLocations(
      isMoH || isSuperUser ? regions : roles.map((loc) => regionLabelsMap[loc]).filter(Boolean)
    );
  }, [roles]);

  useEffect(() => {
    const getParticipants = async () => {
      const currentPage = reducerState.pagination?.currentPage || 0;
      if (!columns) return;
      if (!selectedTab) return;
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
        selectedTabStatuses
      );
      dispatch({
        type: 'updateKey',
        key: 'pagination',
        value: {
          total: pagination.total,
          currentPage: currentPage,
        },
      });
      const newRows = filterData(data, columns);
      setRows(newRows);
      setLoadingData(false);
    };

    getParticipants();
  }, [
    reducerState.pagination?.currentPage,
    reducerState.siteSelector,
    reducerState.emailFilter,
    reducerState.locationFilter,
    reducerState.lastNameFilter,
    reducerState.fsaFilter,
    reducerState.order,
    roles,
    columns,
    selectedTab,
    selectedTabStatuses,
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
      return prettifyStatus(row[columnId], row.id, selectedTab, handleEngage);
    }
    if (columnId === 'distance') {
      if (row[columnId] !== null && row[columnId] !== undefined) {
        return `${math.round(row[columnId] / 1000) || '<1'} Km`;
      }
      return 'N/A';
    }
    if (columnId === 'engage') {
      const engage =
        !row.status.includes('already_hired') &&
        !row.status.includes('withdrawn') &&
        !row.status.includes('archived');

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
          onClick={async (event) => {
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
            setAnchorElement(event.currentTarget);
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
    if (columnId === 'archive') {
      return (
        <Button
          onClick={async (event) => {
            setAnchorElement(event.currentTarget);
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
          }}
          variant='outlined'
          size='small'
          text='Archive'
        />
      );
    }
    return row[columnId];
  };

  if (!columns) return null;
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
            }}
            onSubmit={() => {
              defaultOnClose();
              participantsDispatch({
                type: ParticipantsContext.types.SELECT_TAB,
                payload: 'My Candidates',
              });
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
            initialValues={{
              type: '',
              reason: '',
              status: '',
              rehire: '',
              endDate: moment().format('YYYY/MM/DD'),
              confirmed: false,
            }}
            validationSchema={ArchiveHiredParticipantSchema}
            onSubmit={(values) => {
              handleEngage(actionMenuParticipant.id, 'archived', values);
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
            {selectedTab === 'Hired Candidates' && (
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
              value={selectedTab || false}
              onChange={(_, property) => {
                dispatch({
                  type: 'updateKey',
                  key: 'pagination',
                  value: {
                    currentPage: 0,
                    offset: 0,
                    total: 0,
                  },
                });
                participantsDispatch({
                  type: ParticipantsContext.types.SELECT_TAB,
                  payload: property,
                });
              }}
            >
              {
                tabs.map((key) => (
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
