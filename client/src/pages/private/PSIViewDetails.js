import React, { lazy, useEffect, useState } from 'react';
import { Button, Card, Dialog, Page, CheckPermissions } from '../../components/generic';
import { Box, Chip, Grid, Link, Typography } from '@material-ui/core';
import { scrollUp } from '../../utils';
import store from 'store';
import routes from '../../constants/routes';
import { EditSiteForm } from '../../components/modal-forms';
import { useToast } from '../../hooks';
import { ToastStatus, EditSiteSchema, API_URL } from '../../constants';
import { SiteDetailTabContext } from '../../providers';

const SiteParticipantsTable = lazy(() => import('./SiteParticipantsTable'));

export default ({ match }) => {
  const { openToast } = useToast();
  const [psi, setPSI] = useState({});
  const [activeModalForm, setActiveModalForm] = useState(null);
  const id = match.params.id;

  const handlePSIEdit = async (psi) => {
    const response = await fetch(`${API_URL}/api/v1/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${store.get('TOKEN')}`,
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
      body: JSON.stringify(psi),
    });

    if (response.ok) {
      setActiveModalForm(null);
      fetchDetails(id);
    } else {
      openToast({
        status: ToastStatus.Error,
        message: response.error || response.statusText || 'Server error',
      });
    }
  };

  const fetchDetails = async (id) => {
    const response = await fetch(`${API_URL}/api/v1/psi/${id}`, {
      headers: {
        Authorization: `Bearer ${store.get('TOKEN')}`,
      },
      method: 'GET',
    });

    if (response.ok) {
      const psi = await response.json();
      setPSI({
        instituteName: psi.institute_name,
        postalCode: psi.postal_code,
        healthAuthority: psi.health_authority,
      });
    }
  };

  useEffect(() => {
    fetchDetails(id);
  }, [id]);

  const defaultOnClose = () => {
    setActiveModalForm(null);
  };

  scrollUp();
  return (
    <>
      {/* <Dialog */}
      {/*   title={`Edit PSI (${psi.instituteName})`} */}
      {/*   open={activeModalForm != null} */}
      {/*   onClose={defaultOnClose} */}
      {/* > */}
      {/*   {activeModalForm === 'edit-psi' && ( */}
      {/*     <EditSiteForm */}
      {/*       initialValues={{ */}
      {/*         siteContactFirstName: site.siteContactFirstName, */}
      {/*         siteContactLastName: site.siteContactLastName, */}
      {/*         siteContactPhone: site.siteContactPhone, */}
      {/*         siteContactEmail: site.siteContactEmail, */}
      {/*         siteName: site.siteName, */}
      {/*         registeredBusinessName: site.registeredBusinessName, */}
      {/*         address: site.address, */}
      {/*         city: site.city, */}
      {/*         isRHO: site.isRHO, */}
      {/*         postalCode: site.postalCode, */}
      {/*         allocation: site.allocation, */}
      {/*         operatorContactFirstName: site.operatorContactFirstName, */}
      {/*         operatorContactLastName: site.operatorContactLastName, */}
      {/*         operatorPhone: site.operatorPhone, */}
      {/*         operatorEmail: site.operatorEmail, */}
      {/*       }} */}
      {/*       validationSchema={EditSiteSchema} */}
      {/*       onSubmit={(values) => { */}
      {/*         const history = { */}
      {/*           timestamp: new Date(), */}
      {/*           changes: [], */}
      {/*         }; */}
      {/*         Object.keys(values).forEach((key) => { */}
      {/*           if (values[key] !== site[key]) { */}
      {/*             history.changes.push({ */}
      {/*               field: key, */}
      {/*               from: site[key], */}
      {/*               to: values[key], */}
      {/*             }); */}
      {/*           } */}
      {/*         }); */}
      {/*         handlePSIEdit({ */}
      {/*           siteContactFirstName: values.siteContactFirstName, */}
      {/*           siteContactLastName: values.siteContactLastName, */}
      {/*           siteContactPhone: values.siteContactPhone, */}
      {/*           siteContactEmail: values.siteContactEmail, */}
      {/*           siteName: values.siteName, */}
      {/*           registeredBusinessName: values.registeredBusinessName, */}
      {/*           address: values.address, */}
      {/*           city: values.city, */}
      {/*           isRHO: values.isRHO, */}
      {/*           postalCode: values.postalCode, */}
      {/*           allocation: values.allocation, */}
      {/*           operatorContactFirstName: values.operatorContactFirstName, */}
      {/*           operatorContactLastName: values.operatorContactLastName, */}
      {/*           operatorPhone: values.operatorPhone, */}
      {/*           operatorEmail: values.operatorEmail, */}
      {/*           history: site.history ? [history, ...site.history] : [history], */}
      {/*         }); */}
      {/*       }} */}
      {/*       onClose={defaultOnClose} */}
      {/*     /> */}
      {/*   )} */}
      {/* </Dialog> */}
      <Page>
        <CheckPermissions permittedRoles={['ministry_of_health']} renderErrorMessage={true}>
          <Card>
            <Box pt={4} pb={2} pl={4} pr={4}>
              <Box pb={4} pl={2}>
                <Box pb={2}>
                  <Typography variant='body1'>
                    <Link href={routes.PSIView}>PSI</Link> / {psi.instituteName}
                  </Typography>
                </Box>
                <Grid container>
                  <Typography variant='h2'>
                    <b>{psi.instituteName}</b>
                  </Typography>
                  <CheckPermissions permittedRoles={['ministry_of_health']}>
                    <Box pl={2} pt={0.5}>
                      <Button
                        onClick={async () => {
                          setActiveModalForm('edit-psi');
                        }}
                        variant='outlined'
                        fullWidth={false}
                        size='small'
                        text='Manage PSI'
                      />
                    </Box>
                  </CheckPermissions>
                </Grid>
                <br />
                <Grid container direction='column'>
                  <Typography variant='h4' mt={10}>
                    PSI Info
                  </Typography>
                  <Typography>
                    <b>Postal Code: </b>
                    {psi.postalCode}
                  </Typography>
                </Grid>
              </Box>
            </Box>
            {/* <SiteParticipantsTable */}
            {/*   id={id} */}
            {/*   siteId={site.siteId} */}
            {/*   onArchiveParticipantAction={() => { */}
            {/*     setPSI({}); */}
            {/*     fetchDetails(id); */}
            {/*   }} */}
            {/* /> */}
          </Card>
        </CheckPermissions>
      </Page>
    </>
  );
};
