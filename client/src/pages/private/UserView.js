import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import Grid from '@material-ui/core/Grid';
import { Box, Typography } from '@material-ui/core';
import store from 'store';

import { useToast } from '../../hooks';
import { Button, Page, Table, CheckPermissions } from '../../components/generic';
import { Routes, ToastStatus, API_URL } from '../../constants';
import { useLocation } from 'react-router-dom';
import { sortObjects } from '../../utils';
import { UserMigrationTable } from './UserMigrationTable';
import { mapTableRows } from '../../utils/user-management-table-util';
import { UserManagementDialog } from '../../components/modal-forms/UserManagementDialog';

const columns = [
  { id: 'firstName', name: 'First Name' },
  { id: 'lastName', name: 'Last Name' },
  { id: 'username', name: 'Username' },
  { id: 'emailAddress', name: 'Email Address' },
  { id: 'createdAt', name: 'Created' },
  { id: 'details' },
];

export default () => {
  const [sites, setSites] = useState([]);
  const [order, setOrder] = useState('asc');
  const [modalOpen, setModalOpen] = useState(false);
  const [isLoadingData, setLoadingData] = useState(false);
  const [isPendingRequests, setIsPendingRequests] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserName, setSelectedUserName] = useState(null);
  const [selectedUserDetails, setSelectedUserDetails] = useState(null);
  const [rows, setRows] = useState([]);

  const [orderBy, setOrderBy] = useState(columns[4].id);

  const history = useHistory();
  const location = useLocation();
  const { openToast } = useToast();

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSubmit = async (values) => {
    setLoadingData(true);
    const isUserAccessRequest = location.pathname === Routes.UserPending;
    const response = await fetch(
      `${API_URL}/api/v1/${isUserAccessRequest ? 'approve-user' : 'user-details'}`,
      {
        headers: {
          'Content-type': 'application/json',
          Authorization: `Bearer ${store.get('TOKEN')}`,
        },
        method: isUserAccessRequest ? 'POST' : 'PATCH',
        body: JSON.stringify({ ...values, userId: selectedUserId, username: selectedUserName }),
      }
    );
    setLoadingData(false);
    if (response.ok) {
      setModalOpen(false);
      fetchUsers({ pending: isUserAccessRequest });
      openToast({
        status: ToastStatus.Success,
        message: isUserAccessRequest ? 'Access request approved' : 'User updated',
      });
    } else {
      openToast({
        status: ToastStatus.Error,
        message: isUserAccessRequest ? 'Access request approval failed' : 'User update failed',
      });
    }
  };

  const userManagementOptionsButton = (row, pending) => {
    return (
      <Button
        onClick={async () => {
          setSelectedUserId(row.id);
          setSelectedUserName(row.username);
          if (!pending) {
            setLoadingData(true);
            const response = await fetch(`${API_URL}/api/v1/user-details?id=${row.id}`, {
              headers: { Authorization: `Bearer ${store.get('TOKEN')}` },
              method: 'GET',
            });
            setLoadingData(false);
            if (response.ok) {
              const details = await response.json();
              setSelectedUserDetails(details);
              setModalOpen(true);
              return;
            }
          }
          setModalOpen(true);
        }}
        variant='outlined'
        size='small'
        text='Options'
      />
    );
  };

  const fetchUsers = async ({ pending }) => {
    setLoadingData(true);
    const response = await fetch(`${API_URL}/api/v1/${pending ? 'pending-users' : 'users'}`, {
      headers: { Authorization: `Bearer ${store.get('TOKEN')}` },
      method: 'GET',
    });

    if (response.ok) {
      const { data } = await response.json();
      const rows = data.map((row) => {
        return mapTableRows(columns, row, userManagementOptionsButton(row, pending));
      });
      setRows(rows);
      setIsPendingRequests(rows.length > 0);
    } else {
      setRows([]);
      setIsPendingRequests(false);
    }
    setLoadingData(false);
  };

  const fetchSites = async () => {
    setLoadingData(true);
    const response = await fetch(`${API_URL}/api/v1/employer-sites/user`, {
      headers: { Authorization: `Bearer ${store.get('TOKEN')}` },
      method: 'GET',
    });

    if (response.ok) {
      const { data } = await response.json();
      setSites(data);
    }
    setLoadingData(false);
  };

  const sort = (array) => sortObjects(array, orderBy, order);

  useEffect(() => {
    fetchUsers({ pending: location.pathname === Routes.UserPending });
    fetchSites();
  }, [history, location]);

  return (
    <Page>
      <CheckPermissions permittedRoles={['ministry_of_health']} renderErrorMessage={true}>
        <Grid
          container
          alignContent='center'
          justify='center'
          alignItems='center'
          direction='column'
        >
          <Box pt={4} pb={4} pl={2} pr={2}>
            <Typography variant='subtitle1' gutterBottom>
              {location.pathname === Routes.UserPending
                ? isPendingRequests
                  ? 'Pending Access Requests'
                  : 'No pending access requests'
                : 'Users Management'}
            </Typography>
          </Box>
          {isPendingRequests && (
            <Box pt={2} pb={2} pl={2} pr={2} width='100%'>
              <Table
                columns={columns}
                order={order}
                orderBy={orderBy}
                onRequestSort={handleRequestSort}
                rows={sort(rows)}
                isLoading={isLoadingData}
              />
            </Box>
          )}
          <Box pt={4} pb={4} pl={2} pr={2}>
            <Typography variant='subtitle1' gutterBottom>
              Users to be migrated
            </Typography>
          </Box>
          <Box pt={2} pb={2} pl={2} pr={2} width='100%'>
            <UserMigrationTable />
          </Box>
        </Grid>
      </CheckPermissions>

      {/** Modals */}
      <UserManagementDialog
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        isLoading={isLoadingData}
        rows={rows}
        selectedUserDetails={selectedUserDetails}
        sites={sites}
      />
    </Page>
  );
};
