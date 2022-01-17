import React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { useLocation, Redirect } from 'react-router-dom';
import { Routes } from '../../constants';

import { Page } from '../../components/generic';
import { Form } from '../../components/employer-form';

export default () => {
  const location = useLocation();
  if (!location.state) return <Redirect to={Routes.EmployerForm} />;
  return (
    <div id='confirmation'>
      <Page>
        <Grid item xs={12} sm={11} md={10} lg={8} xl={6}>
          {/** Status */}
          <Box pt={5} pb={2} pl={2} pr={2}>
            <Box mb={2}>
              <Grid container alignItems='center' justifyContent='space-between'>
                <Grid item>
                  <Typography variant='subtitle1' paragraph>
                    Thank you. Your form has been submitted.
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Box>

          {/** Form */}
          <Form initialValues={location.state?.formValues} isDisabled />
        </Grid>
      </Page>
    </div>
  );
};
