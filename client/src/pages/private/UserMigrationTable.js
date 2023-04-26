import React, { useEffect, useState } from 'react';
import store from 'store';
import { FastField, Formik, Form as FormikForm } from 'formik';
import Grid from '@material-ui/core/Grid';
import { Box } from '@material-ui/core';

import { addEllipsisMask, sortObjects } from '../../utils';
import { Button, Table, Dialog } from '../../components/generic';
import { API_URL, EditUserMigrationUserFormSchema, ToastStatus } from '../../constants';
import { RenderTextField } from '../../components/fields';
import { useToast } from '../../hooks';

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
  const [modalOpen, setModalOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('email');

  const { openToast } = useToast();

  const handleSubmit = async (values) => {
    setLoading(true);
    const response = await fetch(`${API_URL}/api/v1/user-migrations/${selectedUser.id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${store.get('TOKEN')}`,
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
      body: JSON.stringify(values),
    });

    if (response.ok) {
      setModalOpen(false);
      await fetchUserMigrations();
      openToast({
        status: ToastStatus.Success,
        message: 'User to be migrated has been updated',
      });
    } else {
      openToast({
        status: ToastStatus.Error,
        message: 'User to be migrated has failed to update',
      });
    }
    setLoading(false);
  };

  const fetchUserMigrations = async () => {
    setLoading(true);
    const response = await fetch(`${API_URL}/api/v1/user-migrations`, {
      headers: { Authorization: `Bearer ${store.get('TOKEN')}` },
      method: 'GET',
    });

    if (response.ok) {
      const { data } = await response.json();
      const rows = data.map((row) => {
        // Pull all relevant props from row based on columns constant
        const mappedRow = columns.reduce(
          (accumulator, column) => ({
            ...accumulator,
            [column.id]: addEllipsisMask(row[column.id], 100),
          }),
          {}
        );
        // Add additional props (user ID, button) to row
        return {
          ...mappedRow,
          id: row.id,
          details: (
            <Button
              onClick={async () => {
                setModalOpen(true);
                setSelectedUser(row);
              }}
              variant='outlined'
              size='small'
              text='Options'
            />
          ),
        };
      });
      setUsers(rows);
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

  const initialValues = {
    username: selectedUser?.username,
    emailAddress: selectedUser?.email,
  };

  return (
    <>
      <Dialog title={'Edit User'} open={modalOpen} onClose={() => setModalOpen(false)}>
        <Formik
          initialValues={initialValues}
          validationSchema={EditUserMigrationUserFormSchema}
          onSubmit={handleSubmit}
        >
          {({ submitForm }) => (
            <FormikForm>
              <Box>
                <FastField name='username' component={RenderTextField} label='* Username' />
              </Box>
              <Box mt={3}>
                <FastField name='emailAddress' component={RenderTextField} label='* Email' />
              </Box>
              <Box mt={3}>
                <Grid container spacing={2} justify='flex-end'>
                  <Grid item>
                    <Button onClick={() => setModalOpen(false)} color='default' text='Cancel' />
                  </Grid>
                  <Grid item>
                    <Button
                      onClick={submitForm}
                      variant='contained'
                      color='primary'
                      text='Submit'
                      disabled={loading}
                    />
                  </Grid>
                </Grid>
              </Box>
            </FormikForm>
          )}
        </Formik>
      </Dialog>

      <Table
        columns={columns}
        order={order}
        orderBy={orderBy}
        onRequestSort={handleRequestSort}
        rows={sortObjects(users, orderBy, order)}
        isLoading={loading}
      />
    </>
  );
};
