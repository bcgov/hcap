import React from 'react';
import { Box, Typography, Dialog as MuiDialog} from '@material-ui/core';

export const Dialog = ({
  open,
  onClose,
  children,
  title,
  initialValues,
  validationSchema,
}) => {
  return (
    <MuiDialog
      open={open}
      onClose={onClose}
      aria-labelledby="simple-modal-title"
      aria-describedby="simple-modal-description"
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
