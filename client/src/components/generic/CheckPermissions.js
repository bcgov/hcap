import React, { Fragment } from 'react';
import Grid from '@material-ui/core/Grid';
import { Box, Typography } from '@material-ui/core';
import { Card } from '.';
import { checkPermissions, checkPending } from '../../utils';

export const CheckPermissions = ({ isLoading, roles, permittedRoles, children, renderErrorMessage = false }) => {
  const isPending = checkPending(roles);

  // If page is currently loading, don't render anything
  if (isLoading) return null;

  // If user has a permitted role assigned, grant access to components
  if (checkPermissions(roles, permittedRoles)) return children;

  // Default: return nothing if no access granted by role(s)
  if (!renderErrorMessage) return null;

  const permissionPendingMessage = <Fragment>
    <p>Thank you for logging in. Your access request is being reviewed.</p>
    <p>Please note that your access will only be granted if you have approved allocations under HCAP.</p>
    <p>Information in the EEOI portal has been collected under sections 26(c) and (e) of the Freedom of Information and Protection of Privacy Act (FOIPPA) for the purposes of administering the Health Career Access Program. Information will only be used by authorized personnel to fulfill the purpose for which it was originally collected or for a use consistent with that purpose. Information to other public bodies or individuals will not be disclosed except as authorized by FOIPPA.</p>
  </Fragment>;

  const permissionDeniedMessage = <p>You don't have permission to view this content.</p>;

  const message = isPending ? permissionPendingMessage : permissionDeniedMessage;

  // Optional message displayed if access not granted by role(s)
  return (
    <Grid container alignContent="center" justify="center" alignItems="center" direction="column">
      <Box pb={4} pl={4} pr={4} pt={2} maxWidth={800}>
        <Card>
          <Typography variant="subtitle1" gutterBottom>
            { message }
          </Typography>
        </Card>
      </Box>
    </Grid>
  );
};
