import React from 'react';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Link from '@material-ui/core/Link';
import Typography from '@material-ui/core/Typography';
import { useLocation, Redirect } from 'react-router-dom';
import { Routes, PEOI_LINK } from '../../constants';

import { PDFButton, Divider, Page } from '../../components/generic';
import { Form } from '../../components/participant-form';

export default () => {
  const location = useLocation();
  if (!location.state) return <Redirect to={Routes.ParticipantForm} />;
  return (
    <div id='confirmation'>
      <Page hideEmployers={!window.location.hostname.includes('freshworks.club')}>
        <Grid item xs={12} sm={11} md={10} lg={8} xl={6}>
          {/** Status */}
          <Box py={4} px={2}>
            <Grid container alignItems='center' justify='space-between'>
              <Grid item>
                <Typography variant='body1' paragraph>
                  Thank you for submitting your expression of interest for the Health Career Access
                  Program. Your submission has been received and you can now login with your BC
                  Services Card anytime to manage your personal information, view your status, and
                  refresh or withdraw your interest. Go to{' '}
                  <Link href={PEOI_LINK} target='_blank'>
                    {PEOI_LINK}
                  </Link>{' '}
                  and click "Login" on the top right of the page.
                </Typography>
                <Typography variant='body1' paragraph>
                  <b>
                    Please submit only one application or expression of interest per stream.
                    Multiple submissions will not increase your chance of being selected and can
                    slow down the process of hiring.
                  </b>
                </Typography>
                <Typography variant='body1' paragraph>
                  Please note, employers are hiring as they are able and continue to hire as new
                  education cohorts are introduced. We are unable to give a specific timeline when a
                  potential employer may contact a participant, an not all interested participants
                  will be contacted.
                </Typography>
                <Typography variant='body1' paragraph>
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
            <Grid container direction='column' alignItems='center' justify='center' item>
              <Box my={2}>
                <Typography variant='body1' paragraph>
                  Your form has been submitted.
                </Typography>
              </Box>
              <Box my={2}>
                <Typography variant='body1'>
                  To submit an application for the other stream, please click{' '}
                  <Link href='/'>
                    <b>here</b>
                  </Link>
                </Typography>
              </Box>
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
