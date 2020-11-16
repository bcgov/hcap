import React from 'react';
import Grid from '@material-ui/core/Grid';
import { Box, Typography } from '@material-ui/core';
import { Page } from '../../components/generic';

const permissionsNeeded =
  <Page >
    <Grid container alignContent="center" justify="center" alignItems="center" direction="column">
      <Box pb={4} pl={4} pr={4} pt={2}>
        <Typography variant="subtitle1" gutterBottom>
          You don't have enough permissions to access this page.
        </Typography>
      </Box>
    </Grid>
  </Page>;

export default function requirePermissions(Component) {

  class AuthenticatedComponent extends React.Component {

    checkPermissions() {
      return false;
    }

    render() {
      return this.checkPermissions()
        ? <Component { ...this.props } />
        : permissionsNeeded;
    }

  }

  return AuthenticatedComponent;
}
