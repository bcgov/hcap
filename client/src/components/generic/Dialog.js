import React from 'react';
import CloseIcon from '@mui/icons-material/Close';
import { Box, Dialog as MuiDialog, DialogTitle, IconButton, DialogContent } from '@mui/material';

export const Dialog = ({
  open,
  onClose,
  children,
  title,
  showDivider = false,
  maxDialogWidth = 'sm',
}) => {
  return (
    <MuiDialog
      fullWidth
      maxWidth={maxDialogWidth}
      open={open}
      onClose={onClose}
      disableEscapeKeyDown={false}
      disableScrollLock={true}
    >
      <DialogTitle>
        <Box display='flex'>
          <Box
            flexGrow={1}
            sx={{
              fontWeight: 400,
              fontSize: '24px',
              color: 'primary.light',
            }}
          >
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
