import React from 'react';
import { Box } from '@material-ui/core';
import { FastField } from 'formik';

import { EditUserMigrationUserFormSchema } from '../../constants';
import { RenderTextField } from '../../components/fields';
import { Dialog } from '../generic';
import { UserManagementViewForm } from './UserManagementViewForm';

export const UserMigrationDialog = ({ isOpen, onClose, onSubmit, selectedUser, isLoading }) => {
  const initialValues = {
    username: selectedUser?.username,
    emailAddress: selectedUser?.email,
  };

  return (
    <Dialog title={'Edit User'} open={isOpen} onClose={onClose}>
      <UserManagementViewForm
        handleSubmit={onSubmit}
        initialValues={initialValues}
        onClose={onClose}
        isLoading={isLoading}
        schema={EditUserMigrationUserFormSchema}
      >
        {({ submitForm }) => (
          <>
            <Box>
              <FastField name='username' component={RenderTextField} label='* Username' />
            </Box>
            <Box mt={3}>
              <FastField name='emailAddress' component={RenderTextField} label='* Email' />
            </Box>
          </>
        )}
      </UserManagementViewForm>
    </Dialog>
  );
};
