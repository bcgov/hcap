import React from 'react';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { useLocation, Redirect } from 'react-router-dom';
import { Routes } from '../../constants';

import { PDFButton, Divider, Page } from '../../components/generic';
import { Form } from '../../components/employee-form';

export default () => {
  const location = useLocation();
  if (!location.state) return <Redirect to={Routes.EmployeeForm} />
  return (
    <div id="confirmation">
      <Page>
        <Grid item xs={12} sm={11} md={10} lg={8} xl={6}>

          {/** Status */}
          <Box pt={5} pb={2} pl={2} pr={2}>
            <Box mb={2}>
              <Grid container alignItems="center" justify="space-between">
                <Grid item>
                  <Typography variant="subtitle1" paragraph>
                    Thank you for your submission. We will contact you within X days/weeks with more information.
                  </Typography>
                  <Typography variant="subtitle1" paragraph>
                    You can always log back in at any time to review the information submitted.
                  </Typography>
                </Grid>
              </Grid>
            </Box>
            <Grid container
              direction="column"
              alignItems="center"
              justify="center" item>
              <Typography variant="body1" paragraph>
                Your form has been submitted.
                  </Typography>
              <Typography variant="body1" gutterBottom>
                Confirmation number:
                  </Typography>
              <Typography variant="subtitle2" paragraph>
                <b>{location.state?.id || 'Failed to retrieve'}</b>
              </Typography>
            </Grid>
            <Divider />
          </Box>

          {/** Form */}
          <Form
            initialValues={location.state?.formValues}
            isDisabled
          />
        </Grid>
      </Page>
    </div>
  );
};
