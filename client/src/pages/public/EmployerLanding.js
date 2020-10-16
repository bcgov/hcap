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
                The Health Career Access Program (HCAP) is a 12-month paid work and training opportunity which provides a path for applicants with no health care experience to get hired into non-direct care roles (Health Care Support Worker, HCSW) and train to become a Health Care Assistants (HCA).
              </Typography>
              <br />
              <Typography variant="body1">
                Employers participating in the Health Career Access Program will have the opportunity to access additional provincially funded staffing and training resources and play a key role in building capacity in the British Columbia health sector and economy.
              </Typography>
              <br />
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Program Goals
              </Typography>
              <Typography variant="body1">
                The Health Career Access Program (HCAP) has been designed to meet a number of high-priority goals in the B.C. Health Sector and in the province more generally:
              </Typography>
              <ul>
                <li>
                  <Typography variant="body1" gutterBottom>
                    Increase staffing of health care assistants at long-term care and assisted living sites in BC.
                    </Typography>
                </li>
                <li>
                  <Typography variant="body1" gutterBottom>
                    Support the COVID-19 response at long-term care and assisted living sites by staffing critical non-clinical non-direct care roles to assist patients, residents, and staff.
                    </Typography>
                </li>
                <li>
                  <Typography variant="body1" gutterBottom>
                    Support BC’s COVID-19 recovery efforts by offering stable employment at long-term care and assisted living across the province.
                    </Typography>
                </li>
                <li>
                  <Typography variant="body1" gutterBottom>
                    Reduce the barriers to entry into health care careers by providing applicants with an opportunity to train to become health care assistants (HCAs) through the course of their employment.
                    </Typography>
                </li>
                <li>
                  <Typography variant="body1" gutterBottom>
                    Improve retention of new employees and existing in the health sector and health care assistants by providing an appealing and standardized pathway to long-term employment as a health care assistant.
                    </Typography>
                </li>
              </ul>
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
