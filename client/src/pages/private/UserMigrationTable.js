import React, { useEffect, useState } from 'react';
import store from 'store';
import { Table } from '../../components/generic';
import { API_URL } from '../../constants';
import { sortObjects } from '../../utils';

const columns = [
  { id: 'username', name: 'Username' },
  { id: 'email', name: 'Email' },
  { id: 'roles', name: 'Roles' },
  { id: 'sites', name: 'Sites' },
];

export const UserMigrationTable = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('email');

  const fetchUserMigrations = async () => {
    setLoading(true);
    const response = await fetch(`${API_URL}/api/v1/user-migrations`, {
      headers: { Authorization: `Bearer ${store.get('TOKEN')}` },
      method: 'GET',
    });
    if (response.ok) {
      const { data } = await response.json();
      setUsers(data);
    } else {
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
  }, []);

  return (
    <Table
      columns={columns}
      order={order}
      orderBy={orderBy}
      onRequestSort={handleRequestSort}
      rows={sortObjects(users, orderBy, order)}
      isLoading={loading}
    />
  );
};
