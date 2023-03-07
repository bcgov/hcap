import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import CloseIcon from '@material-ui/icons/Close';
import {
  Box,
  Dialog as MuiDialog,
  DialogTitle,
  IconButton,
  DialogContent,
} from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  dialogHeader: {
    fontWeight: 400,
    fontSize: '24px',
    color: theme.palette.primary.light,
  },
}));

export const Dialog = ({
  open,
  onClose,
  children,
  title,
  showDivider = false,
  maxDialogWidth = 'sm',
}) => {
  const classes = useStyles();
  return (
    <MuiDialog
      fullWidth
      maxWidth={maxDialogWidth}
      open={open}
      onClose={onClose}
      disableBackdropClick
      className={classes.dialogContainer}
    >
      <DialogTitle>
        <Box display='flex'>
          <Box flexGrow={1} className={classes.dialogHeader}>
            {title}
          </Box>
          {onClose && (
            <IconButton aria-label='close' onClick={onClose}>
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      </DialogTitle>

      <DialogContent dividers={showDivider}>{children}</DialogContent>
    </MuiDialog>
  );
};
