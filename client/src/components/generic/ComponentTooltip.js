import React, { useState } from 'react';
import { Tooltip } from '@mui/material';

export const ComponentTooltip = ({ ...props }) => {
  const [open, setOpen] = useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  const handleOpen = () => {
    setOpen(true);
  };

  return (
    <Tooltip
      open={open}
      onClose={handleClose}
      onOpen={handleOpen}
      onClick={handleOpen} //enable onClick due to mobile devices limitation
      interactive={true}
      componentsProps={{
        tooltip: {
          sx: {
            backgroundColor: 'common.white',
            color: 'rgba(0, 0, 0, 0.87)',
            boxShadow: 1,
            fontSize: 'body1.fontSize',
          },
        },
        arrow: {
          sx: {
            color: 'common.white',
          },
        },
      }}
      {...props}
    />
  );
};
