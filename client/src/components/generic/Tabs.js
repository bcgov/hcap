import React from 'react';
import { styled } from '@mui/material/styles';
import { Tab, Tabs } from '@mui/material';

export const CustomTabs = styled(Tabs)(({ theme }) => ({
  borderTop: `1px solid ${theme.palette.gray.secondary}`,
  borderBottom: `1px solid ${theme.palette.gray.secondary}`,
  marginBottom: theme.spacing(2),
  '& .MuiTabs-indicator': {
    backgroundColor: theme.palette.highlight.primary,
  },
}));

export const CustomTab = styled((props) => <Tab disableRipple {...props} />)(({ theme }) => ({
  textTransform: 'none',
  minWidth: 72,
  fontWeight: theme.typography.fontWeightRegular,
  marginRight: theme.spacing(4),
  '&:hover': {
    color: theme.palette.highlight.primary,
    opacity: 1,
  },
  '&.Mui-selected': {
    color: theme.palette.highlight.secondary,
    fontWeight: theme.typography.fontWeightMedium,
  },
  '&:focus': {
    color: theme.palette.highlight.primary,
  },
}));
