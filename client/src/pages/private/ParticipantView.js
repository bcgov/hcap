import React, { useEffect, useState, useRef } from 'react';
import Grid from '@material-ui/core/Grid';
import { withStyles } from '@material-ui/core/styles';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import { Box, Typography, TextField, Menu, MenuItem } from '@material-ui/core';
import store from 'store';
import { ToastStatus, InterviewingFormSchema, RejectedFormSchema, HireFormSchema } from '../../constants';
import { Page, Table, CheckPermissions, Button, Dialog } from '../../components/generic';
import { InterviewingForm, RejectedForm, HireForm } from '../../components/modal-forms';
import { useToast } from '../../hooks';

const defaultColumns = [
  { id: 'id', name: 'ID' },
  { id: 'lastName', name: 'Last Name' },
  { id: 'firstName', name: 'First Name' },
  { id: 'postalCodeFsa', name: 'FSA' },
  { id: 'preferredLocation', name: 'Preferred Region(s)' },
  { id: 'nonHCAP', name: 'Non-HCAP' },
];

const sortOrder = [
  'id',
  'lastName',
  'firstName',
  'status',
  'postalCodeFsa',
  'phoneNumber',
  'emailAddress',
  'preferredLocation',
  'interested',
  'nonHCAP',
  'crcClear',
  'engage',
];

const tabs = { // Tabs, associated allowed roles, displayed statuses
  'Available Participants': {
    roles: ['employer', 'health_authority'],
    statuses: ['open'],
  },
  'My Candidates': {
    roles: ['employer', 'health_authority'],
    statuses: ['prospecting', 'interviewing', 'offer_made'],
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
    statuses: ['open', 'prospecting', 'interviewing', 'offer_made', 'rejected'],
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
  const [actionMenuParticipant, setActionMenuParticipant] = useState(null);
  const [anchorElement, setAnchorElement] = useState(false);
  const [activeModalForm, setActiveModalForm] = useState(null);
  const [tabValue, setTabValue] = useState(null);
  const offsets = useRef([0]);

  const [locations] = useState([
    'Interior',
    'Fraser',
    'Vancouver Coastal',
    'Vancouver Island',
    'Northern',
  ]);

  const handleTabChange = (event, newValue) => setTabValue(newValue);

  const handleRequestSort = (event, property) => {
    offsets.current.splice(1, offsets.current.length); //reset the pagination if there's a filter/order change
    setOrder({
      field: property,
      direction: order.direction === 'desc' ? 'asc' : 'desc',
    });
    setPagination(oldPagination => ({
      ...oldPagination,
      currentPage: 0,
    }));
  };

  const handleLocationFilter = (value) => {
    offsets.current.splice(1, offsets.current.length);
    setLocationFilter(value);
    setPagination(oldPagination => ({
      ...oldPagination,
      currentPage: 0,
    }));
  };

  const handleFsaFilter = (value) => {
    offsets.current.splice(1, offsets.current.length);
    setFsaFilter(value);
    setPagination(oldPagination => ({
      ...oldPagination,
      currentPage: 0,
    }));
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

      const isEngaged = item.statusInfos?.find(
        item => item.status === 'prospecting'
      ) ? true : false;

      row.engage = { id: item.id, isEngaged };

      filteredRows.push(row);
    });
    return filteredRows;
  };

  useEffect(() => {
    setColumns(oldColumns => {
      if (tabValue === 1 && !oldColumns.find(column => column.id === 'status'))
        return [
          ...oldColumns.slice(0, 3),
          { id: 'status', name: 'Status' },
          ...oldColumns.slice(3),
        ];
      if (tabValue !== 1)
        return oldColumns.filter(column => column.id !== 'status');

      return oldColumns;
    });
  }, [tabValue]);

  const fetchParticipants = async (lastId, regionFilter, fsaFilter, field, direction) => {
    const queries = [
      field && `field=${field}`,
      lastId && `lastId=${lastId}`,
      direction && `direction=${direction}`,
      regionFilter && `regionFilter=${regionFilter}`,
      fsaFilter && `fsaFilter=${fsaFilter}`,
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
      const { data, error } = await response.json();
      if (error) {
        openToast({ status: ToastStatus.Error, message: error.message || 'Failed to submit this form' });
      } else {
        setRows(oldRows => {
          const newRows = [...oldRows];
          const index = newRows.findIndex(row => row.id === participantId);
          newRows[index] = {
            ...newRows[index],
            emailAddress: data.emailAddress || emailAddressMask,
            phoneNumber: data.phoneNumber || phoneNumberMask,
            engage: { id: participantId, status },
            status,
          };

          const { firstName, lastName } = newRows[index];

          const toasts = {
            open: {
              status: ToastStatus.Info,
              message: `${firstName} ${lastName} is has been disengaged`,
            },
            prospecting: {
              status: ToastStatus.Info,
              message: `${firstName} ${lastName} has been engaged`,
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
              message: `${firstName} ${lastName} has been rejected`,
            },
          }

          openToast(toasts[status]);

          return newRows;
        });

        setActionMenuParticipant(null);
        setActiveModalForm(null);
      }
    } else {
      openToast({ status: ToastStatus.Error, message: response.error || response.statusText || 'Server error' });
    }
  };

  useEffect(() => {
    const resultColumns = [...defaultColumns];

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
        setSites(sites)
        setRoles(roles);
        setTabValue(Object.keys(tabs) // Set selected tab to first tab allowed for role
          .find((key) => tabs[key].roles.some((role) => roles.includes(role))))
        const isMoH = roles.includes('ministry_of_health');
        const isSuperUser = roles.includes('superuser');
        if (isMoH || isSuperUser) {
          resultColumns.push(
            { id: 'interested', name: 'Interest' },
            { id: 'crcClear', name: 'CRC Clear' },
          );
        }

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
      setLoadingData(true);
      const { data, pagination } = await fetchParticipants(
        offsets.current[offsets.current.length - 1],
        locationFilter,
        fsaFilter,
        order.field,
        order.direction);

      setPagination({
        total: pagination.total,
        currentPage: offsets.current.length - 1,
      });
      const newRows = filterData(data, resultColumns);
      setRows(oldRows => {
        if (offsets.current.length === 1) return newRows;
        //Only add rows if there's a pagination going on
        return [...oldRows, ...newRows];
      });
      offsets.current.push(pagination.offset);
      setLoadingData(false);
    };

    const init = async () => {
      await fetchUserInfo();
      await getParticipants();
    };
    init();
  }, [pagination.currentPage, locationFilter, fsaFilter, order]);

  const handlePageChange = (oldPage, newPage) => {
    //Only update 'pagination.currentPage' when the next page still not exists
    if (newPage === offsets.current.length - 1)
      setPagination(pagination => ({ ...pagination, currentPage: newPage }));
  };

  const getDialogTitle = (activeModalForm) => {
    if (activeModalForm === 'hired') return 'Hire Participant';
    if (activeModalForm === 'interviewing') return 'Interview Participant';
    if (activeModalForm === 'rejected') return 'Reject Participant';
    return 'Change Participant Status';
  };

  const prettifyStatus = (status) => {
    if (status === 'offer_made') return 'Offer Made';
    if (status === 'open') return 'Open';
    if (status === 'prospecting') return 'Prospecting';
    if (status === 'interviewing') return 'Interviewing';
    if (status === 'rejected') return 'Rejected';
    if (status === 'hired') return 'Hired';
    return status;
  }

  return (
    <Page>
      <Dialog
        title={getDialogTitle(activeModalForm)}
        open={activeModalForm != null}
        onClose={() => setActiveModalForm(null)}
      >
        {activeModalForm === 'interviewing' && <InterviewingForm
          initialValues={{ contactedDate: '' }}
          validationSchema={InterviewingFormSchema}
          onSubmit={(values) => {
            handleEngage(actionMenuParticipant.id, 'interviewing', { contacted_at: values.contactedDate });
          }}
          onClose={() => setActiveModalForm(null)}
        />}

        {activeModalForm === 'rejected' && <RejectedForm
          initialValues={{ contactedDate: '' }}
          validationSchema={RejectedFormSchema}
          onSubmit={(values) => {
            handleEngage(actionMenuParticipant.id, 'rejected', { final_status: values.finalStatus });
          }}
          onClose={() => setActiveModalForm(null)}
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
          onClose={() => setActiveModalForm(null)}
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
                  onChange={({ target }) => handleLocationFilter(target.value)}
                >
                  <MenuItem value="">Preferred Location</MenuItem>
                  {locations.map((option) => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </TextField>
              </Box>
            </Grid>
            <Grid item>
              <Box pl={2}>
                <TextField
                  variant="filled"
                  fullWidth
                  value={fsaFilter || ''}
                  onChange={({ target }) => handleFsaFilter(target.value)}
                  placeholder='Forward Sortation Area'
                />
              </Box>
            </Grid>
          </Grid>
          <Box pt={2} pb={2} pl={2} pr={2} width="100%">
            <CustomTabs
              value={tabValue || false}
              onChange={handleTabChange}
            >
              {
                Object.keys(tabs)
                  .filter((key) => roles.some((role) => tabs[key].roles.includes(role))) // Only display tabs for user role
                  .map((key) => <CustomTab key={key} label={key} value={key} />) // Tab component with tab name as value
              }
            </CustomTabs>
            <Table
              columns={columns}
              order={order.direction}
              orderBy={order.field}
              rowsCount={pagination.total}
              onChangePage={handlePageChange}
              rowsPerPage={10}
              currentPage={pagination.currentPage}
              renderCell={
                (columnId, cell) => {
                  if (columnId === 'status') {
                    return prettifyStatus(cell);
                  }
                  if (columnId === 'engage') {
                    return <Button
                      onClick={(event) => {
                        setActionMenuParticipant(cell);
                        setAnchorElement(event.currentTarget);
                      }}
                      variant="outlined"
                      size="small"
                      text="Actions"
                    />
                  }
                  return cell;
                }
              }
              onRequestSort={handleRequestSort}
              rows={rows}
              isLoading={isLoadingData}
            />
          </Box>
        </Grid>
        <Menu
          keepMounted
          open={actionMenuParticipant != null}
          anchorEl={anchorElement}
          onClose={() => setActionMenuParticipant(null)}
        >
          {actionMenuParticipant?.status === 'open' && <MenuItem onClick={() => handleEngage(actionMenuParticipant.id, 'prospecting')}>Engage</MenuItem>}
          {actionMenuParticipant?.status === 'prospecting' && <MenuItem onClick={() => setActiveModalForm('interviewing')}>Interviewing</MenuItem>}
          {actionMenuParticipant?.status === 'interviewing' && <MenuItem onClick={() => handleEngage(actionMenuParticipant.id, 'offer_made')}>Offer Made</MenuItem>}
          {actionMenuParticipant?.status === 'offer_made' && <MenuItem onClick={() => setActiveModalForm('hired')}>Hire</MenuItem>}
          {['prospecting', 'interviewing', 'offer_made'].includes(actionMenuParticipant?.status) && <MenuItem onClick={() => setActiveModalForm('rejected')}>Rejected</MenuItem>}
          {actionMenuParticipant?.status === 'rejected' && <MenuItem onClick={() => handleEngage(actionMenuParticipant.id, 'prospecting')}>Re-engage</MenuItem>}
        </Menu>
      </CheckPermissions>
    </Page>
  );
};
