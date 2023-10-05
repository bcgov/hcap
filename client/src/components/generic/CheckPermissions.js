import React, { Fragment } from 'react';
import Grid from '@material-ui/core/Grid';
import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Card } from '.';
import { checkPermissions, checkPending } from '../../utils';
import { AuthContext } from '../../providers';

const useStyles = makeStyles(() => ({
  message: {
    textAlign: 'center',
  },
}));

export const CheckPermissions = ({ permittedRoles, children, renderErrorMessage = false }) => {
  const classes = useStyles();
  const { auth } = AuthContext.useAuth();
  const roles = auth.user?.roles || [];
  const isLoading = auth?.isLoading;
  const isPending = checkPending(roles);

  // If page is currently loading, don't render anything
  if (isLoading) return null;

  // If user has a permitted role assigned, grant access to components
  if (checkPermissions(roles, permittedRoles)) {
    return children;
  }

  // Default: return nothing if no access granted by role(s)
  if (!renderErrorMessage) return null;

  const permissionPendingMessage = (
    <Fragment>
      <p>Thank you for logging in. Your access request is being reviewed.</p>
      <p>
        Please note that your access will only be granted if you have approved allocations under
        HCAP.
      </p>
      <p>
        Information in the EEOI portal has been collected under sections 26(c) and (e) of the
        Freedom of Information and Protection of Privacy Act (FOIPPA) for the purposes of
        administering the Health Career Access Program. Information will only be used by authorized
        personnel to fulfill the purpose for which it was originally collected or for a use
        consistent with that purpose. Information to other public bodies or individuals will not be
        disclosed except as authorized by FOIPPA.
      </p>
    </Fragment>
  );

  const permissionDeniedMessage = (
    <>
      <p>Thank you for your access request.</p>
      <p>
        Please contact&nbsp;
        <a href='mailto:HCAPInfoQuery@gov.bc.ca'>HCAPInfoQuery@gov.bc.ca</a>&nbsp; with your user ID
        and site(s) you require access to.
      </p>
      <p>Thank you.</p>
    </>
  );

  const message = isPending ? permissionPendingMessage : permissionDeniedMessage;

  // Optional message displayed if access not granted by role(s)
  return (
    <Grid container alignContent='center' justify='center' alignItems='center' direction='column'>
      <Box pb={4} pl={4} pr={4} pt={2} maxWidth={600}>
        <Card className={classes.message}>
          <Typography variant='subtitle1' gutterBottom>
            {message}
          </Typography>
        </Card>
      </Box>
    </Grid>
  );
};
