import React, { useEffect, useState } from 'react';
import _orderBy from 'lodash/orderBy';
import Grid from '@material-ui/core/Grid';
import { withStyles } from '@material-ui/core/styles';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import { Box, Typography, TextField, Menu, MenuItem } from '@material-ui/core';
import store from 'store';
import { ToastStatus } from '../../constants';
import { Page, Table, CheckPermissions, Button } from '../../components/generic';
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
  'postalCodeFsa',
  'phoneNumber',
  'emailAddress',
  'preferredLocation',
  'interested',
  'nonHCAP',
  'crcClear',
  'engage',
];

const tabs = [
  'Available Participants',
  'My Candidates',
  'Archived Candidates',
  'Hired Candidates',
];

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
  const [order, setOrder] = useState('asc');
  const [isLoadingData, setLoadingData] = useState(false);
  const [isLoadingUser, setLoadingUser] = useState(false);
  const [rows, setRows] = useState([]);
  const [fetchedRows, setFetchedRows] = useState([]);
  const [columns, setColumns] = useState(defaultColumns);
  const [locationFilter, setLocationFilter] = useState(null);
  const [fsaFilter, setFsaFilter] = useState(null);
  const [actionMenuParticipant, setActionMenuParticipant] = useState(null);
  const [anchorElement, setAnchorElement] = useState(false);
  const [locations] = useState([
    'Interior',
    'Fraser',
    'Vancouver Coastal',
    'Vancouver Island',
    'Northern',
  ]);

  const [orderBy, setOrderBy] = useState(columns[0].id);
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortConfig = () => {
    if (orderBy === 'siteName') {
      return [item => item.siteName.toLowerCase(), 'operatorName'];
    } else if (orderBy === 'healthAuthority') {
      return [item => item.healthAuthority.toLowerCase(), 'operatorName'];
    }
    return [orderBy, 'operatorName'];
  };

  const mapItemToColumns = (item, columns) => {
    const row = {};
    columns.map(column => column.id).forEach(columnId => {
      row[columnId] = item[columnId] || '';
    });
    return row;
  };

  useEffect(() => { // Filter table
    let filtered = fetchedRows;

    filtered = filterByTab(tabValue, filtered);

    if (locationFilter) filtered = filtered.filter((row) => row.preferredLocation.includes(locationFilter));
    if (fsaFilter) filtered = filtered.filter((row) => row.postalCodeFsa.toUpperCase().startsWith(fsaFilter.toUpperCase()));
    setRows(filtered);
  }, [locationFilter, fsaFilter, fetchedRows, tabValue]);

  const filterByTab = (tabIndex, rows) => {
    let status;
    switch (tabIndex) {
      case 0:
        status = 'open';
        break;
      case 1:
        status = 'prospecting';
        break;
      default:
        status = 'open';
        break;
    }
    return rows.filter((row) => row.status === status);
  };

  const sort = (array) => _orderBy(array, sortConfig(), [order]);

  const emailAddressMask = '***@***.***';
  const phoneNumberMask = '(***) ***-****';

  const handleEngage = async (participantId, status) => {
    const response = await fetch('/api/v1/employer-actions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${store.get('TOKEN')}`,
        'Accept': 'application/json',
        'Content-type': 'application/json',
      },
      body: JSON.stringify({ participantId, status }),
    });

    if (response.ok) {
      const { data, error } = await response.json();
      if (error) {
        openToast({ status: ToastStatus.Error, message: error.message || 'Failed to submit this form' });
      } else {
        const rows = [...fetchedRows];
        const index = rows.findIndex(row => row.id === participantId);
        rows[index] = {
          ...rows[index],
          emailAddress: data.emailAddress || emailAddressMask,
          phoneNumber: data.phoneNumber || phoneNumberMask,
          engage: { id: participantId, isEngaged: status === 'prospecting' },
        };
        setFetchedRows(rows);
        const { firstName, lastName } = rows[index];
        openToast({
          status: ToastStatus.Success,
          message: `${firstName} ${lastName} moved to ${status} state`,
        });
        setActionMenuParticipant(null);
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
        const { roles } = await response.json();
        setLoadingUser(false);
        setRoles(roles);
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
            { id: 'engage' },
          )
        }

        resultColumns.sort((colum1, column2) => (sortOrder.indexOf(colum1.id) - sortOrder.indexOf(column2.id)));

        setColumns(resultColumns);
      }
    };

    const filterData = (data) => {
      const filteredRows = [];
      data.forEach(dataItem => {

        const item = { ...dataItem };
        if (!item.emailAddress) {
          item.emailAddress = emailAddressMask;
        }

        if (!item.phoneNumber) {
          item.phoneNumber = phoneNumberMask;
        }

        const row = mapItemToColumns(item, resultColumns);

        item.isEngaged = item.statusInfos?.find(
          item => item.status === 'prospecting'
        ) ? true : false;

        row.engage = item;

        filteredRows.push(row);
      });
      return filteredRows;
    }

    const getParticipants = async () => {
      setLoadingData(true);
      const response = await fetch('/api/v1/participants', {
        headers: {
          'Accept': 'application/json',
          'Content-type': 'application/json',
          'Authorization': `Bearer ${store.get('TOKEN')}`,
        },
        method: 'GET',
      });

      let newRows = [];
      if (response.ok) {
        const { data } = await response.json();
        newRows = filterData(data);
      }

      setFetchedRows(newRows);
      setRows(newRows);
      setLoadingData(false);
    };

    const init = async () => {
      await fetchUserInfo();
      await getParticipants();
    };
    init();
  }, []);

  return (
    <Page>
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
                  onChange={({ target }) => setLocationFilter(target.value)}
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
                  onChange={({ target }) => setFsaFilter(target.value)}
                  placeholder='Forward Sortation Area'
                />
              </Box>
            </Grid>
          </Grid>
          <Box pt={2} pb={2} pl={2} pr={2} width="100%">
            <CustomTabs
              value={tabValue}
              onChange={handleTabChange}
            >
              {
                tabs.map((item, index) => <CustomTab key={index} label={item} />)
              }
            </CustomTabs>
            <Table
              columns={columns}
              order={order}
              orderBy={orderBy}
              renderCell={
                (columnId, cell) => {
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
                  } else {
                    return cell;
                  }
                }
              }
              onRequestSort={handleRequestSort}
              rows={sort(rows)}
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
          {!actionMenuParticipant?.isEngaged && <MenuItem onClick={() => handleEngage(actionMenuParticipant.id, 'prospecting')}>Engage</MenuItem>}
          {actionMenuParticipant?.isEngaged && <MenuItem onClick={() => handleEngage(actionMenuParticipant.id, 'interviewing')}>Interviewing</MenuItem>}
          {actionMenuParticipant?.isEngaged && <MenuItem onClick={() => handleEngage(actionMenuParticipant.id, 'open')}>Disengage</MenuItem>}
        </Menu>
      </CheckPermissions>
    </Page>
  );
};
