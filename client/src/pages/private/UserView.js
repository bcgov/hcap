import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import Grid from '@material-ui/core/Grid';
import { Box, Typography } from '@material-ui/core';

import { useToast } from '../../hooks';
import { Button, Page, Table, CheckPermissions } from '../../components/generic';
import { Routes, ToastStatus, Role } from '../../constants';
import { useLocation } from 'react-router-dom';
import { sortObjects } from '../../utils';
import { UserMigrationTable } from './UserMigrationTable';
import { mapTableRows } from '../../utils/user-management-table-util';
import { UserManagementDialog } from '../../components/modal-forms/UserManagementDialog';
import { FeatureFlaggedComponent, flagKeys } from '../../services';
import { axiosInstance } from '../../services/api';

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

    try {
      const method = isUserAccessRequest ? 'post' : 'patch';
      const uri = isUserAccessRequest ? 'approve-user' : 'user-details';
      const payload = { ...values, userId: selectedUserId, username: selectedUserName };

      await axiosInstance[method](uri, payload);

      setLoadingData(false);
      setModalOpen(false);
      fetchUsers({ pending: isUserAccessRequest });
      openToast({
        status: ToastStatus.Success,
        message: isUserAccessRequest ? 'Access request approved' : 'User updated',
      });
    } catch {
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
            try {
              const { data: details } = await axiosInstance.get(`/user-details?id=${row.id}`);
              setLoadingData(false);
              setSelectedUserDetails(details);
              setModalOpen(true);
              return;
            } catch {}
            setLoadingData(false);
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

    try {
      const uri = pending ? 'pending-users' : 'users';

      const {
        data: { data = [] },
      } = await axiosInstance.get(uri);

      const rows = data.map((row) => {
        return mapTableRows(columns, row, userManagementOptionsButton(row, pending));
      });
      setRows(rows);
      setIsPendingRequests(rows.length > 0);
    } catch {
      setRows([]);
      setIsPendingRequests(false);
    }
    setLoadingData(false);
  };

  const fetchSites = async () => {
    setLoadingData(true);
    try {
      const { data } = await axiosInstance.get('/employer-sites/user');
      setSites(data.data);
    } catch {}
    setLoadingData(false);
  };

  const sort = (array) => sortObjects(array, orderBy, order);

  useEffect(() => {
    fetchUsers({ pending: location.pathname === Routes.UserPending });
    fetchSites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, location]);

  return (
    <Page>
      <CheckPermissions permittedRoles={[Role.MinistryOfHealth]} renderErrorMessage={true}>
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
          <FeatureFlaggedComponent featureKey={flagKeys.FEATURE_KEYCLOAK_MIGRATION}>
            <Box pt={4} pb={4} pl={2} pr={2}>
              <Typography variant='subtitle1' gutterBottom>
                Users to be migrated
              </Typography>
            </Box>
            <Box pt={2} pb={2} pl={2} pr={2} width='100%'>
              <UserMigrationTable />
            </Box>
          </FeatureFlaggedComponent>
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
