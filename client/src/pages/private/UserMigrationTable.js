import React, { useEffect, useState } from 'react';

import { sortObjects } from '../../utils';
import { Button, Table } from '../../components/generic';
import { ToastStatus } from '../../constants';
import { useToast } from '../../hooks';
import { mapTableRows } from '../../utils/user-management-table-util';
import { UserMigrationDialog } from '../../components/modal-forms/UserMigrationDialog';
import { axiosInstance } from '../../services/api';

const columns = [
  { id: 'username', name: 'Username' },
  { id: 'email', name: 'Email' },
  { id: 'roles', name: 'Roles' },
  { id: 'sites', name: 'Sites' },
  { id: 'details' },
];

export const UserMigrationTable = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userMigrationModalOpen, setUserMigrationModalOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('email');

  const { openToast } = useToast();

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await axiosInstance.patch(`/user-migrations/${selectedUser.id}`, values);

      setUserMigrationModalOpen(false);
      await fetchUserMigrations();
      openToast({
        status: ToastStatus.Success,
        message: 'User to be migrated has been updated',
      });
    } catch {
      openToast({
        status: ToastStatus.Error,
        message: 'User to be migrated has failed to update',
      });
    }
    setLoading(false);
  };

  const userMigrationOptionsButton = (row) => {
    return (
      <Button
        onClick={async () => {
          setUserMigrationModalOpen(true);
          setSelectedUser(row);
        }}
        variant='outlined'
        size='small'
        text='Options'
      />
    );
  };

  const fetchUserMigrations = async () => {
    setLoading(true);
    try {
      const {
        data: { data },
      } = await axiosInstance.get('/user-migrations');
      const rows = data.map((row) => {
        return mapTableRows(columns, row, userMigrationOptionsButton(row));
      });
      setUsers(rows);
    } catch {
      setUsers([]);
    }
    setLoading(false);
  };

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  useEffect(() => {
    fetchUserMigrations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Table
        columns={columns}
        order={order}
        orderBy={orderBy}
        onRequestSort={handleRequestSort}
        rows={sortObjects(users, orderBy, order)}
        isLoading={loading}
      />

      {/** Modals */}
      <UserMigrationDialog
        isOpen={userMigrationModalOpen}
        onClose={() => setUserMigrationModalOpen(false)}
        onSubmit={handleSubmit}
        isLoading={loading}
        selectedUser={selectedUser}
      />
    </>
  );
};
