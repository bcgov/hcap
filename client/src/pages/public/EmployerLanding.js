import React, { Fragment } from 'react';
import { useHistory } from 'react-router-dom';

import { Page } from '../../components/generic';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Link from '@material-ui/core/Link';
import Typography from '@material-ui/core/Typography';
import { Button } from '../../components/generic';

import { Routes } from '../../constants';

export default () => {
  const history = useHistory();

  const handleProceed = async () => {
    history.push(Routes.Login);
  }

  return (
    <Page>
      <Grid item xs={12} sm={11} md={10} lg={8} xl={6}>
        <Box pt={4} pb={4} pl={2} pr={2}>
          <Fragment>
            <Typography variant="h2" color="primary" gutterBottom>
              Employer Expression of Interest
            </Typography>
            <Typography variant="body1">
              Complete this expression of interest form if you want to join the&nbsp;
              <Link
                href="http://gov.bc.ca/careersinhealth"
                target="__blank"
                rel="noreferrer noopener"
              >
                Health Career Access Program
              </Link>
              &nbsp;as an employer.
            </Typography>
            <br/>
            <Typography variant="body1">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam euismod in augue quis elementum. Fusce mattis tellus nec sem tincidunt, nec ultrices lorem eleifend. Nunc sollicitudin lacus ut convallis ullamcorper. Sed arcu urna, ultrices interdum placerat non, efficitur at leo. Sed iaculis eget odio nec congue. Donec nisi urna, blandit rhoncus tempus id, posuere quis magna. Vestibulum sollicitudin augue nec leo congue lobortis. Phasellus facilisis ultrices libero, ac venenatis eros ultricies vitae. Phasellus eu ornare urna. Fusce feugiat dapibus justo, eget dignissim metus maximus vel. Donec at eros at enim imperdiet finibus. Duis eleifend libero eget sodales dignissim. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Phasellus ut urna ut libero dictum pharetra. In convallis molestie egestas. Maecenas elit nulla, faucibus rhoncus neque non, ullamcorper tempor urna.
            </Typography>
          </Fragment>
        </Box>
        <Box display="flex" justifyContent="center" pt={0} pb={4} pl={2} pr={2}>
          <Button
            onClick={() => handleProceed()}
            variant="contained"
            color="primary"
            fullWidth={false}
            text="Proceed to employer login"
          />
        </Box>
      </Grid>
    </Page>
  );
};
