import React from 'react';
import { Box, Typography, Dialog as MuiDialog} from '@material-ui/core';

export const Dialog = ({
  open,
  onClose,
  children,
  title,
}) => {
  return (
    <MuiDialog
      open={open}
      onClose={onClose}
    >
      <Box pt={4} pb={2} pl={4} pr={4}>
        <Typography variant="subtitle1">
          { title }
        </Typography>
      </Box>
      <Box pt={4} pb={4} pl={4} pr={4}>
        { children }
      </Box>
    </MuiDialog>
  )
};
