import React, { useEffect, useState } from 'react';
import Grid from '@material-ui/core/Grid';
import { Page, CheckPermissions } from '../../components/generic';
import { Box, Typography } from '@material-ui/core';
import { scrollUp } from '../../utils';
import store from 'store';
import { Link } from 'react-router-dom';
import routes from '../../constants/routes';


export default ({ match }) => {
  const [roles, setRoles] = useState([]);
  const [site, setSite] = useState([]);
  const [isLoadingUser, setLoadingUser] = useState(false);
  const siteID = match.params.id;

  const fetchUserInfo = async () => {
    setLoadingUser(true);
    const response = await fetch('/api/v1/user', {
      headers: {
        'Authorization': `Bearer ${store.get('TOKEN')}`,
      },
      method: 'GET',
    });

    if (response.ok) {
      const { roles } = await response.json();
      setLoadingUser(false);
      setRoles(roles);
    }
  }

  useEffect(() => {
    fetchUserInfo();
  }, []);

  useEffect(() => {
    const fetchDetails = async () => {
      const response = await fetch(`/api/v1/employer-sites/${siteID}`, {
        headers: {
          'Authorization': `Bearer ${store.get('TOKEN')}`,
        },
        method: 'GET',
      });

      if (response.ok) {
        setSite(await response.json());
      }
    }

    fetchDetails();
  }, [siteID]);

  const fieldsLabelMap = {
    'Site Contact': {
      'First Name': 'siteContactFirstName',
      'Last Name': 'siteContactLastName',
      'Phone Number': 'siteContactPhone',
      'Email Address': 'siteContactEmail',
    },
    'Site Info': {
      'Site Name': 'siteName',
      'Business Name': 'registeredBusinessName',
      'Address': 'address',
      'Postal Code': 'postalCode',
      'City': 'city',
      'Phase 1 Allocation': 'phaseOneAllocation',
      'Region': 'healthAuthority',
    },
    'Operator Contact Info': {
      'First Name': 'operatorContactFirstName',
      'Last Name': 'operatorContactLastName',
      'Phone Number': 'operatorPhone',
      'Email Address': 'operatorEmail',
    },
  };

  scrollUp();
  return (
    <Page>
      <CheckPermissions isLoading={isLoadingUser} roles={roles} permittedRoles={['health_authority', 'ministry_of_health']} renderErrorMessage={true}>
        <Box pt={4} pb={2} pl={4} pr={4}>
          <Box pb={4}>
            <Box pb={2}>
              <Typography variant="body1">
                <Link to={routes.ParticipantView}>Sites</Link> / {site.siteName}
              </Typography>
            </Box>
            <Typography variant="h2">
              <b>Site Details</b>
            </Typography>
          </Box>
          <Grid container>
            {
              Object.keys(fieldsLabelMap).map(title =>
                <Grid key={title} item>
                  <Box pr={12}>
                    <Box pb={2}>
                      <Typography variant="subtitle1">
                        <b>{title}</b>
                      </Typography>
                    </Box>
                    {
                      Object.keys(fieldsLabelMap[title]).map(subTitle =>
                        <Grid key={subTitle}
                          justify="space-between"
                          container>
                          <Grid item>
                            <Box pr={4} pb={1}>
                              <Typography variant="body1">
                                <b>{subTitle}</b>
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item>
                            <Typography variant="body1">
                              {site[fieldsLabelMap[title][subTitle]]}
                            </Typography>
                          </Grid>
                        </Grid>)
                    }
                  </Box>
                </Grid>)
            }
          </Grid>
        </Box>
      </CheckPermissions>
    </Page>
  );
};
