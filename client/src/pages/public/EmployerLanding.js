import Link from '@material-ui/core/Link';
import React, { Fragment } from 'react';
import { useHistory } from 'react-router-dom';

import { Page, Card, Divider } from '../../components/generic';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { Button } from '../../components/generic';

import { Routes } from '../../constants';

export default () => {
  const history = useHistory();

  const handleProceed = () => {
    history.push(Routes.EmployerForm);
  }

  return (
    <Page>
      <Grid item xs={12} sm={11} md={10} lg={8} xl={6}>
        <Box pt={4} pb={4} pl={2} pr={2}>
          <Card>
            <Fragment>
              <Typography variant="h2" color="primary" gutterBottom>
                The Health Career Access Program
              </Typography>
              <Divider />
              <Typography variant="body1">
              The Health Career Access Program (HCAP) is a 12-month paid work and training initiative for individuals seeking an entry point to employment in health. New hires will start as a Health Care Support Worker providing non-direct care at a long-term care or assisted living site and receive paid training to become a Health Care Assistant upon successful completion of the program.
              </Typography>
              <br />
              <Typography variant="body1">
              A significant number of applicants have already expressed interest in the program through the provincial expression of interest - <Link href="https://www2.gov.bc.ca/gov/content/economic-recovery/work-in-health-care" target="_blank">(https://www2.gov.bc.ca/gov/content/economic-recovery/work-in-health-care)</Link>. As HCAP positions are posted externally, a provincial matching process will connect these individuals to employers that are hiring.
              </Typography>
              <br />
              <Typography variant="body1">
              HCAP has many benefits for employers who will have the opportunity to access new provincially funded staffing and training resources and play a key role in building capacity in the BC health sector and economy.
              </Typography>
              <br />
              <Typography variant="body1">
              Participating employers will be provided with funding to cover education and salary costs for hire Health Care Support Workers who will provide critical non-clinical support while enrolled in a new modular Health Care Assistant training program.
              </Typography>
              <br />
              <Typography variant="body1">
              <b>
                The Employer Expression of Interest is available to operators of long-term care and/or assisted living sites with publicly funded beds.
              </b>
              </Typography>
            </Fragment>
          </Card>
        </Box>
        <Box display="flex" justifyContent="center" pt={0} pb={4} pl={2} pr={2}>
          <Button
            onClick={handleProceed}
            variant="contained"
            color="primary"
            fullWidth={false}
            text="Proceed to employer expression of interest"
          />
        </Box>
      </Grid>
    </Page>
  );
};
