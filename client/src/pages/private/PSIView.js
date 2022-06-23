import React, { useState, useEffect, useMemo, lazy } from 'react';
import { Box, Typography } from '@material-ui/core';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import { saveAs } from 'file-saver';

import { Page, CheckPermissions, Button, Dialog } from '../../components/generic';
import { NewPSIForm, CohortForm } from '../../components/modal-forms';
import {
  ToastStatus,
  API_URL,
  NewCohortSchema,
  DOWNLOAD_DEFAULT_SUCCESS_MESSAGE,
  DOWNLOAD_DEFAULT_ERROR_MESSAGE,
} from '../../constants';
import store from 'store';
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
  // TODO: add in a dropdown once we have multiple download options
  // const [isDownloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [isLoadingPSIParticipantsReport, setLoadingPSIParticipantsReport] = useState(false);

  // Functions
  const defaultOnClose = () => {
    setActiveModalForm(null);
  };

  const handlePSICreate = async (psi) => {
    const response = await fetch(`${API_URL}/api/v1/psi`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${store.get('TOKEN')}`,
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
      body: JSON.stringify(psi),
    });

    if (response.ok) {
      setActiveModalForm(null);
    } else {
      const error = await response.json();
      if (error.code) {
        openToast({
          status: ToastStatus.Error,
          message: error.error || response.error || response.statusText || 'Server error',
        });
      }
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

  const handleDownloadPSIParticipantsReport = async () => {
    setLoadingPSIParticipantsReport(true);

    const response = await fetch(`${API_URL}/api/v1/psi-report/csv/participants`, {
      headers: {
        Authorization: `Bearer ${store.get('TOKEN')}`,
      },
      method: 'GET',
    });

    if (response.ok) {
      const blob = await response.blob();
      saveAs(blob, `participants-attending-psi-${new Date().toJSON()}.csv`);
      openToast({
        status: ToastStatus.Success,
        message: response.message || DOWNLOAD_DEFAULT_SUCCESS_MESSAGE,
      });
    } else {
      openToast({
        status: ToastStatus.Error,
        message: response.error || response.statusText || DOWNLOAD_DEFAULT_ERROR_MESSAGE,
      });
    }

    setLoadingPSIParticipantsReport(false);
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
            <NewPSIForm
              initialValues={{
                instituteName: '',
                healthAuthority: '',
                streetAddress: '',
                city: '',
                postalCode: '',
              }}
              onSubmit={(values) => {
                handlePSICreate({
                  instituteName: values.instituteName,
                  healthAuthority: values.healthAuthority,
                  streetAddress: values.streetAddress,
                  city: values.city,
                  postalCode: values.postalCode,
                });
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
                />
              </Box>
            </CheckPermissions>

            <CheckPermissions
              roles={roles}
              permittedRoles={['ministry_of_health', 'health_authority']}
            >
              <Box alignSelf='flex-end' py={1}>
                {/** TODO: add in a dropdown once we have multiple download options
                  <ClickAwayListener onClickAway={() => setDownloadMenuOpen(false)}> */}
                <Button
                  /** TODO: add in a dropdown once we have multiple download options
                    onClick={() => setDownloadMenuOpen(!isDownloadMenuOpen)}
                    endIcon={<ExpandMoreIcon />}
                    text='Download CSV' 
                  */
                  text='Download participants attending PSI Report'
                  onClick={handleDownloadPSIParticipantsReport}
                  variant='outlined'
                  loading={isLoadingPSIParticipantsReport}
                />

                {/** TODO: add in a dropdown once we have multiple download options
                  <Grow in={isDownloadMenuOpen}>
                    <Paper>
                      <MenuList>
                        <MenuItem onClick={}>
                          Download PSI and Cohort Information
                        </MenuItem>

                        <MenuItem onClick={}>
                          Download Participants attending PSI
                        </MenuItem>
                      </MenuList>
                    </Paper>
                  </Grow>
                */}
              </Box>
            </CheckPermissions>
          </Box>
        </Box>
        <PSITable PSIs={PSIs} handleAddCohortClick={handleAddCohortClick} />
      </CheckPermissions>
    </Page>
  );
};
