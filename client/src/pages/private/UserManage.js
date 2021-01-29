import React, { useEffect, useState } from 'react';
import _orderBy from 'lodash/orderBy';
import { useHistory } from 'react-router-dom';
import Grid from '@material-ui/core/Grid';
import { Box, Typography } from '@material-ui/core';
import store from 'store';
import { useToast } from '../../hooks';
import { Button, Page, Table, CheckPermissions, Dialog } from '../../components/generic';
import { ApproveAccessRequestSchema, ToastStatus } from '../../constants';
import { Field, Formik, Form as FormikForm } from 'formik';
import { RenderMultiSelectField, RenderSelectField, RenderCheckbox } from '../../components/fields';

const columns = [
  { id: 'firstName', name: 'First Name' },
  { id: 'lastName', name: 'Last Name' },
  { id: 'username', name: 'Username' },
  { id: 'emailAddress', name: 'Email Address' },
  { id: 'createdAt', name: 'Created' },
  { id: 'details' },
];

export default () => {

  const [roles, setRoles] = useState([]);
  const [sites, setSites] = useState([]);
  const [order, setOrder] = useState('asc');
  const [modalOpen, setModalOpen] = useState(false);
  const [isLoadingData, setLoadingData] = useState(false);
  const [isLoadingUser, setLoadingUser] = useState(false);
  const [isPendingRequests, setIsPendingRequests] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [rows, setRows] = useState([]);

  const [orderBy, setOrderBy] = useState(columns[4].id);

  const history = useHistory();
  const { openToast } = useToast();

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSubmit = async (values) => {
    const response = await fetch('/api/v1/approve-user', {
      headers: { 'Content-type': 'application/json', 'Authorization': `Bearer ${store.get('TOKEN')}` },
      method: 'POST',
      body: JSON.stringify({ ...values, userId: selectedUserId }),
    });
    if (response.ok) {
      setModalOpen(false);
      fetchPendingUsers();
      openToast({ status: ToastStatus.Success, message: 'Access request approved' });
    } else {
      openToast({ status: ToastStatus.Error, message: 'Access request approval failed' });
    }
  };

  const fetchPendingUsers = async () => {
    setLoadingData(true);
    const response = await fetch('/api/v1/pending-users', {
      headers: { 'Authorization': `Bearer ${store.get('TOKEN')}` },
      method: 'GET',
    });

    if (response.ok) {
      const { data } = await response.json();
      const rows = data.map((row) => {
        // Pull all relevant props from row based on columns constant
        const mappedRow = columns.reduce((accumulator, column) => ({
          ...accumulator,
          [column.id]: row[column.id],
        }), {});
        // Add additional props (user ID, button) to row
        return {
          ...mappedRow,
          id: row.id,
          details: (
            <Button
              onClick={() => {
                setSelectedUserId(row.id);
                setModalOpen(true);
              }}
              variant="outlined"
              size="small"
              text="Options"
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
    const response = await fetch('/api/v1/employer-sites', {
      headers: { 'Authorization': `Bearer ${store.get('TOKEN')}` },
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
    const fetchUserInfo = async () => {
      setLoadingUser(true);
      const response = await fetch('/api/v1/user', {
        headers: { 'Authorization': `Bearer ${store.get('TOKEN')}` },
        method: 'GET',
      });

      if (response.ok) {
        const { roles } = await response.json();
        setRoles(roles);
      }
      setLoadingUser(false);
    };

    fetchUserInfo();
    fetchPendingUsers();
    fetchSites();
  }, [history]);

  const initialValues = {
    sites: [],
    regions: [],
    role: '',
    acknowledgement: false,
  };

  return (
    <Page>
      <Dialog
        title="Approve Access Request"
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <Box mb={4}>
          <Typography variant="body1" gutterBottom>
            Username: <b>{rows?.find((i) => i.id === selectedUserId)?.username || ''}</b>
          </Typography>
          <Typography variant="body1" gutterBottom>
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
                  name="role"
                  component={RenderSelectField}
                  label="* User Role"
                  options={[
                    { value: 'health_authority', label: 'Health Authority' },
                    { value: 'employer', label: 'Private Employer' },
                    { value: 'ministry_of_health', label: 'Ministry Of Health' },
                  ]}
                  onChange={(e) => {
                    setFieldValue('regions', []);
                    setFieldValue('sites', []);
                    setFieldValue('acknowledgement', false);
                    handleChange(e);
                  }}
                />
              </Box>
              {(values.role === 'health_authority') && <Box mt={3}>
                <Field
                  name="regions"
                  component={RenderSelectField}
                  label="* Health Region"
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
                    const forcedArray = { ...e, target: { ...e.target, value: [e.target.value] } };
                    handleChange(forcedArray);
                  }}
                />
              </Box>}
              {((values.role === 'health_authority' && values.regions.length > 0) || values.role === 'employer') && <Box mt={3}>
                <Field
                  name="sites"
                  component={RenderMultiSelectField}
                  label="* Employer Sites (allocation number) - select one or more"
                  options={_orderBy(sites, ['siteName'])
                    .filter(item => item.earlyAdopterAllocation > 0)
                    .filter(item => values.role === 'health_authority' ? values.regions.includes(item.healthAuthority) : true)
                    .map(item => ({
                      value: item.siteId, label: `${item.siteName} (${item.earlyAdopterAllocation})`
                    }))
                  }
                  onChange={(e) => {
                    const regions = sites
                      .filter((site) => e.target.value.includes(site.siteId))
                      .map((site) => site.healthAuthority);
                    const deduped = [...new Set(regions)];
                    if (regions.length > 0) setFieldValue('regions', deduped);
                    handleChange(e);
                  }}
                />
              </Box>}
            {(values.role === 'ministry_of_health') && <Box mt={3}>
                <Field
                  name="acknowledgement"
                  component={RenderCheckbox}
                  type="checkbox"
                  checked={values.acknowledgement}
                  label="I understand that I am granting this user access to potentially sensitive personal information."
                />
              </Box>}


              <Box mt={3}>
                <Grid container spacing={2} justify="flex-end">
                  <Grid item>
                    <Button
                      onClick={() => setModalOpen(false)}
                      color="default"
                      text="Cancel"
                    />
                  </Grid>
                  <Grid item>
                    <Button
                      onClick={submitForm}
                      variant="contained"
                      color="primary"
                      text="Submit"
                    />
                  </Grid>
                </Grid>
              </Box>
            </FormikForm>
          )}
        </Formik>
      </Dialog>
      <CheckPermissions isLoading={isLoadingUser} roles={roles} permittedRoles={['ministry_of_health']} renderErrorMessage={true}>
        <Grid container alignContent="center" justify="center" alignItems="center" direction="column">
          <Box pt={4} pb={4} pl={2} pr={2}>
            <Typography variant="subtitle1" gutterBottom>
              {isPendingRequests ? 'Pending Access Requests' : 'No pending access requests'}
            </Typography>
          </Box>
          {isPendingRequests && <Box pt={2} pb={2} pl={2} pr={2} width="100%">
            <Table
              columns={columns}
              order={order}
              orderBy={orderBy}
              onRequestSort={handleRequestSort}
              rows={sort(rows)}
              isLoading={isLoadingData}
            />
          </Box>}
        </Grid>
      </CheckPermissions>
    </Page>
  );
};
