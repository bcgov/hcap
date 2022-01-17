import React, { useEffect, useState } from 'react';
import _orderBy from 'lodash/orderBy';
import { useHistory } from 'react-router-dom';
import Grid from '@mui/material/Grid';
import { Box, Typography } from '@mui/material';
import store from 'store';
import { useToast } from '../../hooks';
import { Button, Page, Table, CheckPermissions, Dialog } from '../../components/generic';
import {
  ApproveAccessRequestSchema,
  Routes,
  ToastStatus,
  regionLabelsMap,
  API_URL,
} from '../../constants';
import { Field, Formik, Form as FormikForm } from 'formik';
import { RenderMultiSelectField, RenderSelectField, RenderCheckbox } from '../../components/fields';
import { useLocation } from 'react-router-dom';

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
    const isUserAccessRequest = location.pathname === Routes.UserPending;
    const response = await fetch(
      `${API_URL}/api/v1/${isUserAccessRequest ? 'approve-user' : 'user-details'}`,
      {
        headers: {
          'Content-type': 'application/json',
          Authorization: `Bearer ${store.get('TOKEN')}`,
        },
        method: isUserAccessRequest ? 'POST' : 'PATCH',
        body: JSON.stringify({ ...values, userId: selectedUserId }),
      }
    );
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

  const fetchUsers = async ({ pending }) => {
    setLoadingData(true);
    const response = await fetch(`${API_URL}/api/v1/${pending ? 'pending-users' : 'users'}`, {
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
            [column.id]: row[column.id],
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
                setSelectedUserId(row.id);
                if (!pending) {
                  const response = await fetch(`${API_URL}/api/v1/user-details?id=${row.id}`, {
                    headers: { Authorization: `Bearer ${store.get('TOKEN')}` },
                    method: 'GET',
                  });

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
          ),
        };
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
    const response = await fetch(`${API_URL}/api/v1/employer-sites`, {
      headers: { Authorization: `Bearer ${store.get('TOKEN')}` },
      method: 'GET',
    });

    if (response.ok) {
      const { data } = await response.json();
      setSites(data);
    }
    setLoadingData(false);
  };

  const sort = (array) => _orderBy(array, [orderBy, 'operatorName'], [order]);

  useEffect(() => {
    fetchUsers({ pending: location.pathname === Routes.UserPending });
    fetchSites();
  }, [history, location]);

  const roleOptions = [
    { value: 'health_authority', label: 'Health Authority' },
    { value: 'employer', label: 'Private Employer' },
    { value: 'ministry_of_health', label: 'Ministry Of Health' },
  ];

  const initialValues = {
    sites: selectedUserDetails?.sites.map((site) => site.siteId) || [],
    regions:
      [regionLabelsMap[selectedUserDetails?.roles.find((role) => role.includes('region_'))]] || [],
    role: roleOptions.find((item) => selectedUserDetails?.roles.includes(item.value))?.value || '',
    acknowledgement: false,
  };

  return (
    <Page>
      <Dialog
        title={location.pathname === Routes.UserPending ? 'Approve Access Request' : 'Edit User'}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <Box mb={4}>
          <Typography variant='body1' gutterBottom>
            Username: <b>{rows?.find((i) => i.id === selectedUserId)?.username || ''}</b>
          </Typography>
          <Typography variant='body1' gutterBottom>
            Email address: <b>{rows?.find((i) => i.id === selectedUserId)?.emailAddress || ''}</b>
          </Typography>
        </Box>
        <Formik
          initialValues={initialValues}
          validationSchema={ApproveAccessRequestSchema}
          onSubmit={handleSubmit}
        >
          {({ submitForm, values, handleChange, setFieldValue }) => (
            <FormikForm>
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
                    options={[
                      { value: 'Interior', label: 'Interior Health' },
                      { value: 'Fraser', label: 'Fraser Health' },
                      { value: 'Vancouver Coastal', label: 'Vancouver Coastal Health' },
                      { value: 'Vancouver Island', label: 'Vancouver Island Health' },
                      { value: 'Northern', label: 'Northern Health' },
                    ]}
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
                    options={_orderBy(sites, ['siteName'])
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

              <Box mt={3}>
                <Grid container spacing={2} justifyContent='flex-end'>
                  <Grid item>
                    <Button onClick={() => setModalOpen(false)} text='Cancel' />
                  </Grid>
                  <Grid item>
                    <Button
                      onClick={submitForm}
                      variant='contained'
                      color='primary'
                      text='Submit'
                    />
                  </Grid>
                </Grid>
              </Box>
            </FormikForm>
          )}
        </Formik>
      </Dialog>
      <CheckPermissions permittedRoles={['ministry_of_health']} renderErrorMessage={true}>
        <Grid
          container
          alignContent='center'
          justifyContent='center'
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
        </Grid>
      </CheckPermissions>
    </Page>
  );
};
