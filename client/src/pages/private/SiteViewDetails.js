import React, { lazy, useEffect, useState } from 'react';
import { Button, Card, Dialog, Page, CheckPermissions } from '../../components/generic';
import { Box, Chip, Grid, Link, Typography } from '@material-ui/core';
import { scrollUp } from '../../utils';
import store from 'store';
import routes from '../../constants/routes';
import { EditSiteForm } from '../../components/modal-forms';
import { useToast } from '../../hooks';
import { ToastStatus, EditSiteSchema, API_URL } from '../../constants';

const SiteParticipantsTable = lazy(() => import('./SiteParticipantsTable'));

export default ({ match }) => {
  const { openToast } = useToast();
  const [site, setSite] = useState({});
  const [activeModalForm, setActiveModalForm] = useState(null);
  const id = match.params.id;

  const handleSiteEdit = async (site) => {
    const response = await fetch(`${API_URL}/api/v1/employer-sites/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${store.get('TOKEN')}`,
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
      body: JSON.stringify(site),
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
    const response = await fetch(`${API_URL}/api/v1/employer-sites/${id}`, {
      headers: {
        Authorization: `Bearer ${store.get('TOKEN')}`,
      },
      method: 'GET',
    });

    if (response.ok) {
      setSite(await response.json());
    }
  };

  useEffect(() => {
    fetchDetails(id);
  }, [id]);

  const fieldsLabelMap = {
    'Site Contact': {
      'First Name': 'siteContactFirstName',
      'Last Name': 'siteContactLastName',
      'Phone Number': 'siteContactPhone',
      'Email Address': 'siteContactEmail',
    },
    'Operator Contact': {
      'First Name': 'operatorContactFirstName',
      'Last Name': 'operatorContactLastName',
      'Phone Number': 'operatorPhone',
      'Email Address': 'operatorEmail',
    },
    'Site Info': {
      'Site Name': 'siteName',
      'Business Name': 'registeredBusinessName',
      'Street Address': 'address',
      City: 'city',
      'Postal Code': 'postalCode',
      Region: 'healthAuthority',
    },
    'Positions Overview': {
      Allocation: 'allocation',
      'HCAP Hires': 'hcapHires',
      'Non-HCAP Hires': 'nonHcapHires',
    },
  };

  const defaultOnClose = () => {
    setActiveModalForm(null);
  };

  scrollUp();
  return (
    <>
      <Dialog
        title={`Edit Site (${site.siteName})`}
        open={activeModalForm != null}
        onClose={defaultOnClose}
      >
        {activeModalForm === 'edit-site' && (
          <EditSiteForm
            initialValues={{
              siteContactFirstName: site.siteContactFirstName,
              siteContactLastName: site.siteContactLastName,
              siteContactPhone: site.siteContactPhone,
              siteContactEmail: site.siteContactEmail,
              siteName: site.siteName,
              registeredBusinessName: site.registeredBusinessName,
              address: site.address,
              city: site.city,
              isRHO: site.isRHO,
              postalCode: site.postalCode,
              allocation: site.allocation,
              operatorContactFirstName: site.operatorContactFirstName,
              operatorContactLastName: site.operatorContactLastName,
              operatorPhone: site.operatorPhone,
              operatorEmail: site.operatorEmail,
            }}
            validationSchema={EditSiteSchema}
            onSubmit={(values) => {
              const history = {
                timestamp: new Date(),
                changes: [],
              };
              Object.keys(values).forEach((key) => {
                if (values[key] !== site[key]) {
                  history.changes.push({
                    field: key,
                    from: site[key],
                    to: values[key],
                  });
                }
              });
              handleSiteEdit({
                siteContactFirstName: values.siteContactFirstName,
                siteContactLastName: values.siteContactLastName,
                siteContactPhone: values.siteContactPhone,
                siteContactEmail: values.siteContactEmail,
                siteName: values.siteName,
                registeredBusinessName: values.registeredBusinessName,
                address: values.address,
                city: values.city,
                isRHO: values.isRHO,
                postalCode: values.postalCode,
                allocation: values.allocation,
                operatorContactFirstName: values.operatorContactFirstName,
                operatorContactLastName: values.operatorContactLastName,
                operatorPhone: values.operatorPhone,
                operatorEmail: values.operatorEmail,
                history: site.history ? [history, ...site.history] : [history],
              });
            }}
            onClose={defaultOnClose}
          />
        )}
      </Dialog>
      <Page>
        <CheckPermissions
          permittedRoles={['health_authority', 'ministry_of_health']}
          renderErrorMessage={true}
        >
          <Card>
            <Box pt={4} pb={2} pl={4} pr={4}>
              <Box pb={4} pl={2}>
                <Box pb={2}>
                  <Typography variant='body1'>
                    <Link href={routes.SiteView}>Sites</Link> / {site.siteName}
                  </Typography>
                </Box>
                <Grid container>
                  <Typography variant='h2'>
                    <b>{site.siteName}</b>
                  </Typography>
                  <CheckPermissions permittedRoles={['ministry_of_health']}>
                    <Box pl={2} pt={0.5}>
                      <Button
                        onClick={async () => {
                          setActiveModalForm('edit-site');
                        }}
                        variant='outlined'
                        fullWidth={false}
                        size='small'
                        text='Edit'
                      />
                    </Box>
                  </CheckPermissions>
                </Grid>
                {site.isRHO ? (
                  <Box pt={1}>
                    <Chip size='small' color='primary' label='Regional Health Authority' />
                  </Box>
                ) : null}
              </Box>
              <Grid container>
                {Object.keys(fieldsLabelMap).map((title) => (
                  <Grid key={title} item xs={12} sm={6} xl={3} style={{ marginBottom: 40 }}>
                    <Box pr={2} pl={2}>
                      <Box pb={2}>
                        <Typography variant='subtitle1'>
                          <b>{title}</b>
                        </Typography>
                      </Box>
                      {Object.keys(fieldsLabelMap[title]).map((subTitle) => (
                        <Grid key={subTitle} container style={{ marginBottom: 5 }}>
                          <Grid item xs={12}>
                            <Box pr={4} pb={1}>
                              <Typography variant='body1'>
                                <b>{subTitle}</b>
                              </Typography>
                              <Typography variant='body1'>
                                {site[fieldsLabelMap[title][subTitle]]}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      ))}
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
            <Box pl={4}>
              <Typography variant='subtitle1'>
                <b>Hired Participants</b>
              </Typography>
            </Box>
            <SiteParticipantsTable
              siteId={site.siteId}
              onArchiveParticipantAction={() => {
                setSite({});
                fetchDetails(id);
              }}
            />
          </Card>
        </CheckPermissions>
      </Page>
    </>
  );
};
