import React, { useEffect, useState } from 'react';
import Grid from '@material-ui/core/Grid';
import { Box, Typography } from '@material-ui/core';
import { useHistory } from 'react-router-dom';
import { Page, Button } from '../../components/generic';
import { Routes } from '../../constants';
import store from 'store';

export default () => {

  const [roles, setRoles] = useState([]);
  const history = useHistory();

  const fetchRoles = async () => {
    const response = await fetch('/api/v1/roles', {
      headers: {
        'Authorization': `Bearer ${store.get('TOKEN')}`,
      },
      method: 'GET',
    });

    if (response.ok) {
      const { roles } = await response.json();
      setRoles(roles);
    }
  }

  useEffect(() => {
    fetchRoles();
  }, []);

  const renderAdminButton = (key, route, label) => <Button
    key={key}
    onClick={async () => {
      history.push(route);
    }}
    variant="contained"
    color="primary"
    fullWidth={false}
    text={label}
  />;

  return (
    <Page >
      <Grid container alignContent="center" justify="center" alignItems="center" direction="column">
        <Box pb={4} pl={4} pr={4} pt={2}>
          {
            roles.length === 0 ?
              <Typography variant="subtitle1" gutterBottom>
                You don't have enough permissions.
              </Typography>
              :
              roles.includes('admin') ?
                [renderAdminButton(0, Routes.EmployeeUpload, 'Upload Employees')]
                :
                roles.map((item, index) => {
                  switch (item) {
                    case 'maximus':
                      return renderAdminButton(index, Routes.EmployeeUpload, 'Upload Employees');
                    default:
                      return null
                  }
                })
          }
        </Box>
      </Grid>
    </Page>
  );
};
