import React, { Fragment } from 'react';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';
import { styled } from '@mui/material/styles';

import { RenderTextField } from '.';

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  paddingLeft: '10px',
  paddingRight: '10px',
  paddingTop: '9px',
  paddingBottom: '9px',
  borderTopRightRadius: '4px',
  borderBottomRightRadius: '4px',
  backgroundColor: theme.palette.primary.main,
  borderRadius: 0,
  '&:hover': {
    backgroundColor: theme.palette.primary.main,
  },
}));

export const RenderSearchField = ({ ...props }) => {
  return (
    <Fragment>
      <RenderTextField
        sx={{
          '& > .MuiOutlinedInput-adornedEnd': {
            paddingRight: '0',
          },
        }}
        variant='outlined'
        InputProps={{
          endAdornment: (
            <StyledIconButton centerRipple={false} color='inherit' type='submit'>
              <SearchIcon sx={{ color: '#FFFFFF' }} />
            </StyledIconButton>
          ),
        }}
        {...props}
      />
    </Fragment>
  );
};
