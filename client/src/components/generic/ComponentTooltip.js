import React, { useState } from 'react';
import { styled } from '@mui/material/styles';
import { Tooltip } from '@mui/material';
const PREFIX = 'ComponentTooltip';

const classes = {
  tooltip: `${PREFIX}-tooltip`,
  arrow: `${PREFIX}-arrow`,
};

const StyledTooltip = styled(Tooltip)(({ theme }) => ({
  [`& .${classes.tooltip}`]: {
    backgroundColor: theme.palette.common.white,
    color: 'rgba(0, 0, 0, 0.87)',
    boxShadow: theme.shadows[1],
    fontSize: theme.typography.body1.fontSize,
  },

  [`& .${classes.arrow}`]: {
    color: theme.palette.common.white,
  },
}));

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
      classes={{ tooltip: classes.tooltip, arrow: classes.arrow }}
      open={open}
      onClose={handleClose}
      onOpen={handleOpen}
      onClick={handleOpen} //enable onClick due to mobile devices limitation
      interactive={true}
      {...props}
    />
  );
};
