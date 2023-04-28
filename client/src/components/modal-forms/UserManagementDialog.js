import React from 'react';
import { Field } from 'formik';
import { Box, Typography } from '@material-ui/core';
import { useLocation } from 'react-router-dom';

import {
  ApproveAccessRequestSchema,
  Routes,
  healthAuthorities,
  regionLabelsMap,
} from '../../constants';
import { RenderMultiSelectField, RenderSelectField, RenderCheckbox } from '../../components/fields';
import { Dialog } from '../generic';
import { UserManagementViewForm } from './UserManagementViewForm';

const roleOptions = [
  { value: 'health_authority', label: 'Health Authority' },
  { value: 'employer', label: 'Private Employer' },
  { value: 'ministry_of_health', label: 'Ministry Of Health' },
];

export const UserManagementDialog = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  rows,
  selectedUserDetails,
  sites,
}) => {
  const location = useLocation();

  const initialValues = {
    sites: selectedUserDetails?.sites.map((site) => site.siteId) || [],
    regions:
      [regionLabelsMap[selectedUserDetails?.roles.find((role) => role.includes('region_'))]] || [],
    role: roleOptions.find((item) => selectedUserDetails?.roles.includes(item.value))?.value || '',
    acknowledgement: false,
  };

  return (
    <Dialog
      title={location.pathname === Routes.UserPending ? 'Approve Access Request' : 'Edit User'}
      open={isOpen}
      onClose={onClose}
    >
      <Box mb={4}>
        <Typography variant='body1' gutterBottom>
          Username: <b>{rows?.find((i) => i.id === selectedUserDetails)?.username || ''}</b>
        </Typography>
        <Typography variant='body1' gutterBottom>
          Email address:{' '}
          <b>{rows?.find((i) => i.id === selectedUserDetails)?.emailAddress || ''}</b>
        </Typography>
      </Box>
      <UserManagementViewForm
        handleSubmit={onSubmit}
        initialValues={initialValues}
        onClose={onClose}
        isLoading={isLoading}
        schema={ApproveAccessRequestSchema}
      >
        {({ submitForm, values, handleChange, setFieldValue }) => (
          <>
            <Box>
              <Field
                name='role'
                component={RenderSelectField}
                label='* User Role'
                options={roleOptions}
                onChange={(e) => {
                  setFieldValue('regions', []);
                  setFieldValue('sites', []);
                  setFieldValue('acknowledgement', false);
                  handleChange(e);
                }}
              />
            </Box>
            {values.role === 'health_authority' && (
              <Box mt={3}>
                <Field
                  name='regions'
                  component={RenderSelectField}
                  label='* Health Region'
                  options={healthAuthorities}
                  onChange={(e) => {
                    setFieldValue('sites', []);
                    // Wrap single region value in array
                    const forcedArray = {
                      ...e,
                      target: { ...e.target, value: [e.target.value] },
                    };
                    handleChange(forcedArray);
                  }}
                />
              </Box>
            )}
            {((values.role === 'health_authority' && values.regions.length > 0) ||
              values.role === 'employer') && (
              <Box mt={3}>
                <Field
                  name='sites'
                  component={RenderMultiSelectField}
                  label='* Employer Sites (allocation number) - select one or more'
                  options={sites
                    .filter((item) =>
                      values.role === 'health_authority'
                        ? values.regions.includes(item.healthAuthority)
                        : true
                    )
                    .map((item) => ({
                      value: item.siteId,
                      label: `${item.siteName} (${item.allocation || 0})`,
                    }))}
                  onChange={(e) => {
                    const regions = sites
                      .filter((site) => e.target.value.includes(site.siteId))
                      .map((site) => site.healthAuthority);
                    const deduped = [...new Set(regions)];
                    if (regions.length > 0) setFieldValue('regions', deduped);
                    handleChange(e);
                  }}
                />
              </Box>
            )}
            {values.role === 'ministry_of_health' && (
              <Box mt={3}>
                <Field
                  name='acknowledgement'
                  component={RenderCheckbox}
                  type='checkbox'
                  checked={values.acknowledgement}
                  label='I understand that I am granting this user access to potentially sensitive personal information.'
                />
              </Box>
            )}
          </>
        )}
      </UserManagementViewForm>
    </Dialog>
  );
};
