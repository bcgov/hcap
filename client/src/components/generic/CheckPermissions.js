import React from 'react';
import Grid from '@material-ui/core/Grid';
import { Box, Typography } from '@material-ui/core';
import { checkPermissions, checkPending } from '../../utils';

export const CheckPermissions = ({ isLoading, roles, permittedRoles, children, renderErrorMessage = false }) => {
  const isPending = checkPending(roles);
  if (isLoading) {
    return null;
  }

  // If user has a permitted role assigned, grant access to components
  if (checkPermissions(roles, permittedRoles)) {
    return children;
  }

  const message1 = isPending 
  ? `    Thank you for logging in. Your access request is being reviewed.`
  : `You don't have permission to view this content.`;
  
  const message2 = `Please note that your access will only be granted if you have approved allocations under HCAP.` 
 

  // Optional: display message if no access granted by role(s)
  if (renderErrorMessage) {
    return (
      <Grid container alignContent="center" justify="center" alignItems="center" direction="column">
        <Box pb={4} pl={4} pr={4} pt={2}>
          <Typography variant="subtitle1" gutterBottom>
            { message1 }
	    { isPending? <><br/><p>{message2}</p></> : null }
          </Typography>
        </Box>
      </Grid>
    );
  }

  // Default: return nothing if no access granted by role(s)
  return null;
};
