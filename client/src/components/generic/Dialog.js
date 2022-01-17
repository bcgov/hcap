import React from 'react';
import { styled } from '@mui/material/styles';
import { Box, Typography, Dialog as MuiDialog, Divider } from '@mui/material';

const PREFIX = 'Dialog';

const classes = {
  root: `${PREFIX}-root`,
};

const StyledMuiDialog = styled(MuiDialog)(() => ({
  [`& .${classes.root}`]: {
    width: '1000px',
    maxWidth: '600px',
  },
}));

export const Dialog = ({ open, onClose, children, title, showDivider = false }) => {
  return (
    <StyledMuiDialog open={open} onClose={onClose} disableBackdropClick>
      <Box pt={4} pb={2} pl={4} pr={4} className={classes.root}>
        <Typography variant='subtitle1'>{title}</Typography>
      </Box>
      {showDivider && <Divider />}
      <Box pb={4} pl={4} pr={4}>
        {children}
      </Box>
    </StyledMuiDialog>
  );
};
