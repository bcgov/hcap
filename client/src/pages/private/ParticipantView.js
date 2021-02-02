import React, { useEffect, useState } from 'react';
import Grid from '@material-ui/core/Grid';
import { withStyles } from '@material-ui/core/styles';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import { Box, Typography, TextField, Menu, MenuItem } from '@material-ui/core';
import store from 'store';
import InfoIcon from '@material-ui/icons/Info';
import {
  ToastStatus,
  InterviewingFormSchema,
  RejectedFormSchema,
  HireFormSchema,
  HiredParticipantSchema,
  EditParticipantFormSchema,
} from '../../constants';
import { Page, Table, CheckPermissions, Button, Dialog } from '../../components/generic';
import { ProspectingForm, InterviewingForm, RejectedForm, HireForm, NewParticipantForm, EditParticipantForm } from '../../components/modal-forms';
import { useToast } from '../../hooks';
import { ComponentTooltip } from '../../components/generic/ComponentTooltip';
import { DebounceTextField } from '../../components/generic/DebounceTextField';

const pageSize = 10;

const defaultColumns = [
  { id: 'id', name: 'ID' },
  { id: 'lastName', name: 'Last Name' },
  { id: 'firstName', name: 'First Name' },
  { id: 'postalCodeFsa', name: 'FSA' },
  { id: 'preferredLocation', name: 'Preferred Region(s)' },
  { id: 'nonHCAP', name: 'Non-HCAP' },
  { id: 'callbackStatus', name: 'Callback Status', sortable: false },
];

const sortOrder = [
  'id',
  'lastName',
  'firstName',
  'status',
  'statusInfo',
  'postalCodeFsa',
  'phoneNumber',
  'emailAddress',
  'preferredLocation',
  'interested',
  'nonHCAP',
  'crcClear',
  'callbackStatus',
  'engage',
  'edit',
];

const tabs = { // Tabs, associated allowed roles, displayed statuses
  'Available Participants': {
    roles: ['employer', 'health_authority'],
    statuses: ['open'],
  },
  'My Candidates': {
    roles: ['employer', 'health_authority'],
    statuses: ['prospecting', 'interviewing', 'offer_made', 'unavailable'],
  },
  'Archived Candidates': {
    roles: ['employer', 'health_authority'],
    statuses: ['rejected'],
  },
  'Hired Candidates': {
    roles: ['employer', 'health_authority'],
    statuses: ['hired'],
  },
  Participants: {
    roles: ['ministry_of_health', 'superuser'],
    statuses: ['open', 'prospecting', 'interviewing', 'offer_made', 'rejected', 'hired'],
  },
};

const CustomTabs = withStyles(theme => ({
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
  const [fsaFilter, setFsaFilter] = useState(null);
  const [fsaText, setFsaText] = useState(null);
  const [lastNameFilter, setLastNameFilter] = useState(null);
  const [lastNameText, setLastNameText] = useState(null);
  const [emailFilter, setEmailFilter] = useState(null);
  const [emailText, setEmailText] = useState(null);
  const [hideLastNameAndEmailFilter, setHideLastNameAndEmailFilter] = useState(true);
  const [actionMenuParticipant, setActionMenuParticipant] = useState(null);
  const [anchorElement, setAnchorElement] = useState(false);
  const [activeModalForm, setActiveModalForm] = useState(null);
  const [tabValue, setTabValue] = useState(null);

  const [locations, setLocations] = useState([]);

  const handleRequestSort = (event, property) => {
    setOrder({
      field: property,
      direction: order.direction === 'desc' ? 'asc' : 'desc',
    });
    setPagination(oldPagination => ({
      ...oldPagination,
      currentPage: 0,
    }));
  };

  const handleTabChange = (event, newValue) => {
    setPagination(oldPagination => ({
      ...oldPagination,
      currentPage: 0,
    }));
    setTabValue(newValue);
  };

  const handleLocationFilter = (value) => {
    setLocationFilter(value);
    setPagination(oldPagination => ({
      ...oldPagination,
      currentPage: 0,
    }));
  };

  const handleFsaFilter = (value) => {
    setPagination(oldPagination => ({
      ...oldPagination,
      currentPage: 0,
    }));
    setFsaFilter(value);
  };

  const handleLastNameFilter = (value) => {
    setPagination(oldPagination => ({
      ...oldPagination,
      currentPage: 0,
    }));
    setLastNameFilter(value);
  };

  const handleEmailFilter = (value) => {
    setPagination(oldPagination => ({
      ...oldPagination,
      currentPage: 0,
    }));
    setEmailFilter(value);
  };

  const filterData = (data, columns) => {

    const mapItemToColumns = (item, columns) => {
      const row = {};
      columns.map(column => column.id).forEach(columnId => {
        row[columnId] = item[columnId] || '';
      });
      return row;
    };

    const filteredRows = [];
    data && data.forEach(dataItem => {

      const item = { ...dataItem };
      if (!item.emailAddress) {
        item.emailAddress = emailAddressMask;
      }

      if (!item.phoneNumber) {
        item.phoneNumber = phoneNumberMask;
      }

      const row = mapItemToColumns(item, columns);

      row.engage = item;

      if (item.statusInfos && item.statusInfos.length > 0) {
        if (item.statusInfos.find((statusInfo) => statusInfo.status === 'already_hired')) {
          const previousStatus = item.statusInfos.find((statusInfo) => statusInfo.data?.previous);
          row.status = [previousStatus?.data.previous || item.statusInfos[0].status, 'already_hired'];
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

  const fetchParticipants = async (offset, regionFilter, fsaFilter, lastNameFilter,
    emailFilter, sortField, sortDirection, statusFilters) => {
      const queries = [
        sortField && `sortField=${sortField}`,
        offset && `offset=${offset}`,
        sortDirection && `sortDirection=${sortDirection}`,
        regionFilter && `regionFilter=${regionFilter}`,
        fsaFilter && `fsaFilter=${fsaFilter}`,
        lastNameFilter && `lastNameFilter=${lastNameFilter}`,
        emailFilter && `emailFilter=${emailFilter}`,
        ...statusFilters && statusFilters.map(status => `statusFilters[]=${status}`),
      ].filter(item => item).join('&');

      const response = await fetch(`/api/v1/participants?${queries}`, {
        headers: {
          'Accept': 'application/json',
          'Content-type': 'application/json',
          'Authorization': `Bearer ${store.get('TOKEN')}`,
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
    const response = await fetch('/api/v1/employer-actions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${store.get('TOKEN')}`,
        'Accept': 'application/json',
        'Content-type': 'application/json',
      },
      body: JSON.stringify({ participantId, status, data: additional }),
    });

    if (response.ok) {
      const { data: statusData, error } = await response.json();
      if (error) {
        openToast({ status: ToastStatus.Error, message: error.message || 'Failed to submit this form' });
      } else if (status === 'prospecting') { // Modal appears after submitting
        setActiveModalForm('prospecting');
      } else {

        const index = rows.findIndex(row => row.id === participantId);
        const { firstName, lastName } = rows[index];

        const toasts = {
          open: {
            status: ToastStatus.Info,
            message: `${firstName} ${lastName} is has been disengaged`,
          },
          interviewing: {
            status: ToastStatus.Info,
            message: `${firstName} ${lastName} is now being interviewed`,
          },
          offer_made: {
            status: ToastStatus.Info,
            message: `${firstName} ${lastName} has been made a job offer`,
          },
          hired: {
            status: ToastStatus.Success,
            message: `${firstName} ${lastName} has been hired`,
          },
          rejected: {
            status: ToastStatus.Info,
            message: `${firstName} ${lastName} has been archived`,
          },
          already_hired: {
            status: ToastStatus.Info,
            message: `${firstName} ${lastName} is already hired by someone else`,
          }
        };

        openToast(toasts[statusData?.status === 'already_hired' ? statusData.status : status]);
        setActionMenuParticipant(null);
        setActiveModalForm(null);
        forceReload(pagination);
      }
    } else {
      openToast({ status: ToastStatus.Error, message: response.error || response.statusText || 'Server error' });
    }
  };

  const handleExternalHire = async (participantInfo) => {
    const response = await fetch('/api/v1/new-hired-participant', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${store.get('TOKEN')}`,
        'Accept': 'application/json',
        'Content-type': 'application/json',
      },
      body: JSON.stringify({participantInfo}),
    });

    if (response.ok) {
      const { error } = await response.json();
      if (error) {
        openToast({ status: ToastStatus.Error, message: error.message || 'Failed to submit this form' });
      } else {
        setActionMenuParticipant(null);
        setActiveModalForm(null);
        forceReload(pagination);
      }
    } else {
      openToast({ status: ToastStatus.Error, message: response.error || response.statusText || 'Server error' });
    }
  };

  const forceReload = async (currentPagination) => {
    if (!tabValue) return;
    const currentPage = currentPagination.currentPage;
    setLoadingData(true);
    const { data, pagination } = await fetchParticipants(
      currentPage * pageSize,
      locationFilter,
      fsaFilter,
      lastNameFilter,
      emailFilter,
      order.field,
      order.direction,
      tabs[tabValue].statuses,
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
    const locationRoles = {
      region_interior: 'Interior',
      region_fraser: 'Fraser',
      region_vancouver_coastal: 'Vancouver Coastal',
      region_vancouver_island: 'Vancouver Island',
      region_northern: 'Northern'
    };

    const fetchUserInfo = async () => {
      setLoadingUser(true);
      const response = await fetch('/api/v1/user', {
        headers: {
          'Authorization': `Bearer ${store.get('TOKEN')}`,
        },
        method: 'GET',
      });

      if (response.ok) {
        const { roles, sites } = await response.json();
        setLoadingUser(false);
        setSites(sites);
        setRoles(roles);
        if (!tabValue) {
          setTabValue(Object.keys(tabs) // Set selected tab to first tab allowed for role
            .find((key) => tabs[key].roles.some((role) => roles.includes(role))));
        }
        const isMoH = roles.includes('ministry_of_health');
        const isSuperUser = roles.includes('superuser');
        if (isMoH || isSuperUser) {
          resultColumns.push(
            { id: 'interested', name: 'Interest' },
            { id: 'crcClear', name: 'CRC Clear' },
            { id: 'statusInfo', name: 'Status' },
            { id: 'edit' },
          );
        }

        // Either returns all location roles or a role mapping with a Boolean filter removes all undefined values
        setLocations((isMoH || isSuperUser) ? Object.values(locationRoles) : roles.map((loc) => locationRoles[loc]).filter(Boolean));

        if (!isMoH) {
          resultColumns.push(
            { id: 'phoneNumber', name: 'Phone Number' },
            { id: 'emailAddress', name: 'Email Address' },
          )
        }

        if (!isMoH && !isSuperUser) {
          resultColumns.push(
            { id: 'engage' },
          )
        }

        resultColumns.sort((colum1, column2) => (sortOrder.indexOf(colum1.id) - sortOrder.indexOf(column2.id)));

        setColumns(resultColumns);
      }
    };


    const getParticipants = async () => {
      if (!tabValue) return;
      setLoadingData(true);
      const { data, pagination } = await fetchParticipants(
        currentPage * pageSize,
        locationFilter,
        fsaFilter,
        lastNameFilter,
        emailFilter,
        order.field,
        order.direction,
        tabs[tabValue].statuses,
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

      setColumns(oldColumns => {
        setHideLastNameAndEmailFilter(['Available Participants', 'Archived Candidates'].includes(tabValue));

        if (tabValue !== 'Available Participants') oldColumns = oldColumns.filter(column => column.id !== 'callbackStatus');

        if (['My Candidates', 'Archived Candidates'].includes(tabValue) && !oldColumns.find(column => column.id === 'status'))
          return [
            ...oldColumns.slice(0, 3),
            { id: 'status', name: 'Status' },
            ...oldColumns.slice(3),
          ];

        if (tabValue === 'Hired Candidates')
          oldColumns = oldColumns.filter(column => column.id !== 'engage');

        if (!['My Candidates', 'Archived Candidates'].includes(tabValue))
          return oldColumns.filter(column => column.id !== 'status');

        return oldColumns;
      });
    };
    runAsync();
  }, [pagination.currentPage, locationFilter, fsaFilter, lastNameFilter, emailFilter, order, tabValue]);

  const handlePageChange = (oldPage, newPage) => {
    setPagination(pagination => ({ ...pagination, currentPage: newPage }));
  };

  const getDialogTitle = (activeModalForm) => {
    if (activeModalForm === 'prospecting') return 'Candidate Engaged';
    if (activeModalForm === 'hired') return 'Hire Participant';
    if (activeModalForm === 'interviewing') return 'Interview Participant';
    if (activeModalForm === 'rejected') return 'Archive Participant';
    if (activeModalForm === 'new-participant') return 'Add New Non-Portal Hire';
    if (activeModalForm === 'edit-participant') return 'Edit Participant';
    return 'Change Participant Status';
  };

  const prettifyStatus = (status, id) => {
    let firstStatus = status[0];
    if (status[0] === 'offer_made') firstStatus = 'Offer Made';
    if (status[0] === 'open') firstStatus = 'Open';
    if (status[0] === 'prospecting') firstStatus = 'Prospecting';
    if (status[0] === 'interviewing') firstStatus = 'Interviewing';
    if (status[0] === 'rejected') firstStatus = 'Archived';
    if (status[0] === 'hired') firstStatus = 'Hired';
    return <div style={{
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
    }}>{firstStatus} {status[1] && <ComponentTooltip arrow
      title={<div style={{ margin: 10 }}>
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 10,
        }}><InfoIcon color="secondary" style={{ marginRight: 10 }} fontSize="small" />
          This candidate was hired by another employer.</div>
        {tabValue !== 'Archived Candidates' && <div style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'flex-end',
        }}>
          <Button
            onClick={() => {
              handleEngage(id, 'rejected', { final_status: 'hired by other', previous: status[0] });
            }}
            size="small"
            fullWidth={false}
            text="Move to Archived Candidates"
          />
        </div>}
      </div>}>
      <InfoIcon style={{ marginLeft: 5 }} color="secondary" />
    </ComponentTooltip>}</div>;
  }

  const defaultOnClose = () => {
    setActiveModalForm(null);
    setActionMenuParticipant(null);
  };

  return (
    <Page>
      <Dialog
        title={getDialogTitle(activeModalForm)}
        open={activeModalForm != null}
        onClose={defaultOnClose}
      >

        {activeModalForm === 'prospecting' && <ProspectingForm
          name={`${actionMenuParticipant.firstName} ${actionMenuParticipant.lastName}`}
          onClose={() => {
            forceReload(pagination);
            defaultOnClose();
          }}
          onSubmit={() => {
            defaultOnClose();
            handleTabChange(null, 'My Candidates');
          }}
        />}

        {activeModalForm === 'interviewing' && <InterviewingForm
          initialValues={{ contactedDate: '' }}
          validationSchema={InterviewingFormSchema}
          onSubmit={(values) => {
            handleEngage(actionMenuParticipant.id, 'interviewing', { contacted_at: values.contactedDate });
          }}
          onClose={defaultOnClose}
        />}

        {activeModalForm === 'rejected' && <RejectedForm
          initialValues={{ contactedDate: '' }}
          validationSchema={RejectedFormSchema}
          onSubmit={(values) => {
            handleEngage(actionMenuParticipant.id, 'rejected', { final_status: values.finalStatus });
          }}
          onClose={defaultOnClose}
        />}

        {activeModalForm === 'hired' && <HireForm
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
        />}
        {activeModalForm === 'edit-participant' && <EditParticipantForm
          initialValues={{
            ...actionMenuParticipant
          }}
          validationSchema={EditParticipantFormSchema}
          onSubmit={async (values) => {
            if (values.phoneNumber && Number.isInteger(values.phoneNumber)) values.phoneNumber = values.phoneNumber.toString();
            const history = {
              timestamp: new Date(),
              changes: [],
            };
            Object.keys(values).forEach(key => {
              if (values[key] !== actionMenuParticipant[key]) {
                history.changes.push({
                  field: key,
                  from: actionMenuParticipant[key],
                  to: values[key],
                });
              }
            });
            values.history = (actionMenuParticipant.history)? [history, ...actionMenuParticipant.history] : [history];
            const response = await fetch('/api/v1/participant', {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${store.get('TOKEN')}`,
                'Accept': 'application/json',
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

        />}
        {activeModalForm === 'new-participant' && <NewParticipantForm
          sites={sites}
          initialValues={{
            firstName: '',
            lastName: '',
            phoneNumber: '',
            emailAddress: '',
            origin: '',
            otherOrigin: '',
            nonHcapOpportunity: false,
            contactedDate: '',
            hiredDate: '',
            startDate: '',
            site: '',
            acknowledge: false,
          }}
          validationSchema={HiredParticipantSchema}
          onSubmit={(values) => {
            handleExternalHire({
              firstName: values.firstName,
              lastName: values.lastName,
              phoneNumber: values.phoneNumber,
              emailAddress: values.emailAddress,
              origin: values.origin,
              otherOrigin: values.otherOrigin,
              nonHcapOpportunity: values.nonHcapOpportunity,
              contactedDate: values.contactedDate,
              hiredDate: values.hiredDate,
              startDate: values.startDate,
              site: values.site,
              acknowledge: values.acknowledge,
            });
          }}
          onClose={defaultOnClose}
        />}
      </Dialog>
      <CheckPermissions isLoading={isLoadingUser} roles={roles} permittedRoles={['employer', 'health_authority', 'ministry_of_health']} renderErrorMessage={true}>
        <Grid container alignContent="center" justify="center" alignItems="center" direction="column">
          <Box pt={4} pb={4} pl={2} pr={2}>
            <Typography variant="subtitle1" gutterBottom>
              Participants
            </Typography>
          </Box>
          <Grid container alignContent="center" justify="flex-start" alignItems="center" direction="row">
            <Grid item>
              <Box pl={2} pr={2} pt={1}>
                <Typography variant="body1" gutterBottom>
                  Filter:
                </Typography>
              </Box>
            </Grid>
            <Grid item>
              <Box>
                <TextField
                  select
                  fullWidth
                  variant="filled"
                  inputProps={{ displayEmpty: true }}
                  value={locationFilter || ''}
                  disabled={isLoadingData || locations.length === 1}
                  onChange={({ target }) => handleLocationFilter(target.value)}
                  aria-label="location filter"
                >
                  {
                    locations.length === 1 ?
                      <MenuItem value=''>{locations[0]}</MenuItem>
                      :
                      ['Preferred Location', ...locations].map((option, index) => (
                        <MenuItem key={option} value={index === 0 ? '' : option} aria-label={option}>{option}</MenuItem>
                      ))
                  }
                </TextField>
              </Box>
            </Grid>
            <Grid item>
              <Box pl={2}>
                <DebounceTextField
                  time={1000}
                  variant="filled"
                  fullWidth
                  value={fsaText || ''}
                  disabled={isLoadingData}
                  onDebounce={(text) => handleFsaFilter(text)}
                  onChange={({ target }) => setFsaText(target.value)}
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
                  value={lastNameText || ''}
                  disabled={isLoadingData}
                  onDebounce={(text) => handleLastNameFilter(text)}
                  onChange={({ target }) => setLastNameText(target.value)}
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
                  value={emailText || ''}
                  disabled={isLoadingData}
                  onDebounce={(text) => handleEmailFilter(text)}
                  onChange={({ target }) => setEmailText(target.value)}
                  placeholder='Email'
                />}
              </Box>
            </Grid>
            {tabValue === "Hired Candidates" && <Grid container item xs={2} style={{'marginLeft': 'auto', 'marginRight': 20}}>
              <Button
                onClick={() => setActiveModalForm("new-participant")}
                text="Add Non-Portal Hire"
                size="medium"
              />
            </Grid>}
          </Grid>
          <Box pt={2} pb={2} pl={2} pr={2} width="100%">
            <CustomTabs
              value={tabValue || false}
              onChange={handleTabChange}
            >
              {
                Object.keys(tabs)
                  .filter((key) => roles.some((role) => tabs[key].roles.includes(role))) // Only display tabs for user role
                  .map((key) => <CustomTab key={key} label={key} value={key} disabled={isLoadingData} />) // Tab component with tab name as value
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
              renderCell={
                (columnId, row) => {
                  if (columnId === 'status') {
                    return prettifyStatus(row[columnId], row.id);
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
                        const response = await fetch(`/api/v1/participant?id=${row.id}`, {
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
                  return row[columnId];
                }
              }
              onRequestSort={handleRequestSort}
              rows={rows}
              isLoading={isLoadingData}
            />
          </Box>
        </Grid>
        {(!roles.includes('ministry_of_health')) && (!roles.includes('superuser')) && <Menu
          keepMounted
          open={actionMenuParticipant != null && activeModalForm == null}
          anchorEl={anchorElement}
          onClose={() => setActionMenuParticipant(null)}
        >
          {actionMenuParticipant?.status === 'open' && <MenuItem onClick={() => handleEngage(actionMenuParticipant.id, 'prospecting')}>Engage</MenuItem>}
          {actionMenuParticipant?.status === 'prospecting' && <MenuItem onClick={() => setActiveModalForm('interviewing')}>Interviewing</MenuItem>}
          {actionMenuParticipant?.status === 'interviewing' && <MenuItem onClick={() => handleEngage(actionMenuParticipant.id, 'offer_made')}>Offer Made</MenuItem>}
          {actionMenuParticipant?.status === 'offer_made' && <MenuItem onClick={() => setActiveModalForm('hired')}>Hire</MenuItem>}
          {['prospecting', 'interviewing', 'offer_made'].includes(actionMenuParticipant?.status) && <MenuItem onClick={() => setActiveModalForm('rejected')}>Archive</MenuItem>}
          {actionMenuParticipant?.status === 'rejected' && <MenuItem onClick={() => handleEngage(actionMenuParticipant.id, 'prospecting')}>Re-engage</MenuItem>}
        </Menu>
        }
      </CheckPermissions>
    </Page>
  );
};
