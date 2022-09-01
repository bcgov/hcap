import React, { lazy, useEffect, useState, useCallback } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Box, Chip, Grid, Link, Typography } from '@material-ui/core';

import { Button, Card, Dialog, Page, CheckPermissions } from '../../components/generic';
import { scrollUp } from '../../utils';
import store from 'store';
import routes from '../../constants/routes';
import { EditSiteForm } from '../../components/modal-forms';
import { useToast } from '../../hooks';
import { ToastStatus, EditSiteSchema, API_URL } from '../../constants';
import { SiteDetailTabContext } from '../../providers';

const SiteViewDetailsTabs = lazy(() => import('./SiteViewDetailsTabs'));

const useStyles = makeStyles(() => ({
  cardRoot: {
    minWidth: '1020px',
  },
}));

export default ({ match }) => {
  const { openToast } = useToast();
  const classes = useStyles();
  const [site, setSite] = useState({});
  const [activeModalForm, setActiveModalForm] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
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
    setIsLoading(false);
    if (response.ok) {
      setActiveModalForm(null);
      fetchDetails();
    } else {
      openToast({
        status: ToastStatus.Error,
        message: response.error || response.statusText || 'Server error',
      });
    }
  };

  const fetchDetails = useCallback(async () => {
    const response = await fetch(`${API_URL}/api/v1/employer-sites/${id}`, {
      headers: {
        Authorization: `Bearer ${store.get('TOKEN')}`,
      },
      method: 'GET',
    });

    if (response.ok) {
      setSite(await response.json());
    }
  }, [id, setSite]);

  useEffect(() => {
    fetchDetails();
  }, [id, fetchDetails]);

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
              operatorName: site.operatorName,
              operatorContactFirstName: site.operatorContactFirstName,
              operatorContactLastName: site.operatorContactLastName,
              operatorPhone: site.operatorPhone,
              operatorEmail: site.operatorEmail,
            }}
            validationSchema={EditSiteSchema}
            isLoading={isLoading}
            onSubmit={(values) => {
              setIsLoading(true);
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
                operatorName: values.operatorName,
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
          <SiteDetailTabContext.TabProvider site={site}>
            <Card className={classes.cardRoot}>
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
              </Box>
              <SiteViewDetailsTabs id={id} siteId={site.siteId} />
            </Card>
          </SiteDetailTabContext.TabProvider>
        </CheckPermissions>
      </Page>
    </>
  );
};
