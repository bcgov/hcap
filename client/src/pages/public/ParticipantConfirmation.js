import React from 'react';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { useLocation, Redirect } from 'react-router-dom';
import { Routes } from '../../constants';

import { PDFButton, Divider, Page } from '../../components/generic';
import { Form } from '../../components/participant-form';

export default () => {
  const location = useLocation();
  if (!location.state) return <Redirect to={Routes.ParticipantForm} />;
  return (
    <div id='confirmation'>
      <Page hideEmployers={true}>
        <Grid item xs={12} sm={11} md={10} lg={8} xl={6}>
          {/** Status */}
          <Box pt={5} pb={2} pl={2} pr={2}>
            <Box mb={2}>
              <Grid container alignItems='center' justify='space-between'>
                <Grid item>
                  <Typography variant='subtitle1' paragraph>
                    Thank you for your submission.
                  </Typography>
                  <Typography variant='subtitle1' paragraph>
                    To protect your personal information from third parties, we will not send you a
                    copy of this form by email. If you want to keep a copy for your records, you can
                    download a copy using the Download PDF button below.
                  </Typography>
                </Grid>
                <Grid
                  container
                  direction='column'
                  alignItems='center'
                  justify='center'
                  id='pdfButtonWrapper'
                  item
                >
                  <Grid item>
                    <PDFButton
                      target='confirmation'
                      fileName={`HCAP-Participant-EOI-Submission.pdf`}
                      filter={(node) => !['pdfButtonWrapper'].includes(node.id)}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Box>
            <Grid container direction='column' alignItems='center' justify='center' item>
              <Typography variant='body1' paragraph>
                Your form has been submitted.
              </Typography>
            </Grid>
            <Divider />
          </Box>

          {/** Form */}
          <Form initialValues={location.state?.formValues} isDisabled />
        </Grid>
      </Page>
    </div>
  );
};
