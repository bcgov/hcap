import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Box, Typography, Dialog as MuiDialog, Divider } from '@material-ui/core';

const useStyles = makeStyles(() => ({
  root: {
    width: '1000px',
    maxWidth: '600px',
  },
}));

export const Dialog = ({ open, onClose, children, title, showDivider = false }) => {
  const classes = useStyles();
  return (
    <MuiDialog open={open} onClose={onClose} disableBackdropClick>
      <Box pt={4} pb={2} pl={4} pr={4} className={classes.root}>
        <Typography variant='subtitle1'>{title}</Typography>
      </Box>
      {showDivider && <Divider />}
      <Box pb={4} pl={4} pr={4}>
        {children}
      </Box>
    </MuiDialog>
  );
};
