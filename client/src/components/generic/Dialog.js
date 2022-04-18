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

const useStyles = makeStyles(() => ({
  root: {
    minWidth: '600px',
    maxWidth: '1000px',
  },
}));

export const Dialog = ({ open, onClose, children, title, showDivider = false }) => {
  const classes = useStyles();
  return (
    <MuiDialog open={open} onClose={onClose} disableBackdropClick>
      <DialogTitle>
        <Box pr={4} display='flex' className={classes.root}>
          <Box flexGrow={1}>{title}</Box>
          {onClose && (
            <IconButton aria-label='close' onClick={onClose}>
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      </DialogTitle>
      
      <DialogContent dividers={showDivider}>
        {children}
      </DialogContent>
    </MuiDialog>
  );
};
