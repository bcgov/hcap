import React from 'react';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { useLocation, Redirect } from 'react-router-dom';
import { Routes } from '../../constants';

import { PDFButton, Divider, Page } from '../../components/generic';
import { Form } from '../../components/form';

export default () => {
  const location = useLocation();
  if (!location.state) return <Redirect to={Routes.Form} />
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
                    Thank you for your submission. Write down this confirmation number and print this page for your records. We will contact you within 3 weeks with more information.
                  </Typography>
                </Grid>
                <Grid container
                  direction="column"
                  alignItems="center"
                  justify="center" id="pdfButtonWrapper" item>
                  <Grid item>
                    <PDFButton
                      target="confirmation"
                      fileName={`submission_${location.state?.id}.pdf`}
                      filter={(node) => !['pdfButtonWrapper'].includes(node.id)}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Box>
            <Typography variant="body1" paragraph>
              Thank you. Your form has been submitted.
            </Typography>
            <Typography variant="body1" gutterBottom>
              Confirmation number:
            </Typography>
            <Typography variant="subtitle2" paragraph>
              <b>{location.state?.id || 'Failed to retrieve'}</b>
            </Typography>
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
