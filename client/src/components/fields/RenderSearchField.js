import React from 'react';
import { styled } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';

import { RenderTextField } from '.';

const PREFIX = 'RenderSearchField';

const classes = {
  root: `${PREFIX}-root`,
  iconButton: `${PREFIX}-iconButton`,
  searchIcon: `${PREFIX}-searchIcon`,
};

// TODO jss-to-styled codemod: The Fragment root was replaced by div. Change the tag if needed.
const Root = styled('div')(({ theme }) => ({
  [`& .${classes.root}`]: {
    '& > .MuiOutlinedInput-adornedEnd': {
      paddingRight: '0',
    },
  },

  [`& .${classes.iconButton}`]: {
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
  },

  [`& .${classes.searchIcon}`]: {
    color: '#FFFFFF',
  },
}));

export const RenderSearchField = ({ ...props }) => {
  return (
    <Root>
      <RenderTextField
        className={classes.root}
        variant='outlined'
        InputProps={{
          endAdornment: (
            <IconButton
              centerRipple={false}
              className={classes.iconButton}
              color='inherit'
              type='submit'
              size='large'
            >
              <SearchIcon className={classes.searchIcon} />
            </IconButton>
          ),
        }}
        {...props}
      />
    </Root>
  );
};
