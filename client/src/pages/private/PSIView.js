import React, { useState, useEffect, useMemo, lazy } from 'react';
import store from 'store';

import { Box, Typography } from '@material-ui/core';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';

import { Page, CheckPermissions, Button, Dialog } from '../../components/generic';
import { PSIForm, CohortForm } from '../../components/modal-forms';
import { ToastStatus, API_URL, NewCohortSchema } from '../../constants';
import { AuthContext } from '../../providers';
import { useToast } from '../../hooks';

const PSITable = lazy(() => import('./PSITable'));

export default () => {
  // Variables
  const [PSIs, setPSIs] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [selectedPSI, setSelectedPSI] = useState(null);
  const [activeModalForm, setActiveModalForm] = useState(null);
  const { openToast } = useToast();

  const { auth } = AuthContext.useAuth();
  const roles = useMemo(() => auth.user?.roles || [], [auth.user]);

  // Functions
  const defaultOnClose = () => {
    setActiveModalForm(null);
  };

  const handlePSICreate = async (result) => {
    const [success, errorText] = result;
    if (success) {
      setActiveModalForm(null);
      openToast({
        status: ToastStatus.SUCCESS,
        message: 'PSI created successfully',
      });
    } else {
      openToast({
        status: ToastStatus.Error,
        message: errorText,
      });
    }
  };

  const handleAddCohortClick = (psiID) => {
    setSelectedPSI(psiID);
    setActiveModalForm('add-cohort');
  };

  const handleAddCohort = async (cohort) => {
    const response = await fetch(`${API_URL}/api/v1/psi/${selectedPSI}/cohorts/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${store.get('TOKEN')}`,
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
      body: JSON.stringify(cohort),
    });

    if (response.ok) {
      setActiveModalForm(null);
    } else {
      openToast({
        status: ToastStatus.Error,
        message: response.error || response.statusText || 'Server error',
      });
    }
  };

  // Hooks
  useEffect(() => {
    const fetchCohorts = async () => {
      const response = await fetch(`${API_URL}/api/v1/cohorts`, {
        headers: { Authorization: `Bearer ${store.get('TOKEN')}` },
        method: 'GET',
      });
      if (response.ok) {
        const data = await response.json();
        setCohorts(data);
      } else {
        setCohorts([]);
      }
    };

    fetchCohorts();
  }, [activeModalForm]);

  useEffect(() => {
    const fetchPSIs = async () => {
      const response = await fetch(`${API_URL}/api/v1/psi`, {
        headers: { Authorization: `Bearer ${store.get('TOKEN')}` },
        method: 'GET',
      });
      if (response.ok) {
        const data = await response.json();
        const mappedData = data.map((row) => {
          const rowCohorts = cohorts.filter((cohort) => cohort.psi_id === row.id);
          // To calculate available_seats, we filter out the expired cohorts and
          // then sum the remaining seats of the current ones
          return {
            ...row,
            id: row.id,
            cohorts: rowCohorts.length,
            available_seats: rowCohorts.reduce(
              (sum, cohort) => sum + (cohort.cohort_size - cohort.participants.length),
              0
            ),
          };
        });
        setPSIs(mappedData);
      } else {
        setPSIs([]);
      }
    };
    fetchPSIs();
  }, [cohorts]);

  // Render
  return (
    <Page>
      <CheckPermissions
        permittedRoles={['ministry_of_health', 'health_authority']}
        renderErrorMessage={true}
      >
        <Dialog
          title={activeModalForm === 'new-psi' ? `Create New Institute` : `Create New Cohort`}
          open={activeModalForm != null}
          onClose={defaultOnClose}
        >
          {activeModalForm === 'new-psi' && (
            <PSIForm
              onSubmit={(result) => {
                handlePSICreate(result);
              }}
              onClose={defaultOnClose}
            />
          )}
          {activeModalForm === 'add-cohort' && (
            <CohortForm
              validationSchema={NewCohortSchema}
              onSubmit={(values) => {
                handleAddCohort({
                  ...values,
                  psiID: selectedPSI,
                });
              }}
              onClose={defaultOnClose}
            />
          )}
        </Dialog>
        <Box width='100%' pt={4} px={2}>
          <Typography variant='subtitle1' align='center' gutterBottom>
            Manage Post Secondary Institutes
          </Typography>
          <Box display='flex' flexDirection='column'>
            <CheckPermissions
              roles={roles}
              permittedRoles={['ministry_of_health', 'health_authority']}
            >
              <Box alignSelf='flex-end' py={1}>
                <Button
                  onClick={() => {
                    setActiveModalForm('new-psi');
                  }}
                  startIcon={<AddCircleOutlineIcon />}
                  text='Add Post Secondary Institution'
                  test-id='add-psi-button'
                />
              </Box>
            </CheckPermissions>
          </Box>
        </Box>
        <PSITable PSIs={PSIs} handleAddCohortClick={handleAddCohortClick} />
      </CheckPermissions>
    </Page>
  );
};
