import React from 'react';
import { styled } from '@mui/material/styles';
import Grid from '@mui/material/Grid';

import { Header } from './Header';

const PREFIX = 'Page';

const classes = {
  root: `${PREFIX}-root`,
  autoHeight: `${PREFIX}-autoHeight`,
};

// TODO jss-to-styled codemod: The Fragment root was replaced by div. Change the tag if needed.
const Root = styled('div')(() => ({
  [`& .${classes.root}`]: (props) => ({
    height: 'calc(100vh - 82px)',
    justifyContent: props.centered ? 'center' : 'flex-start',
    alignItems: 'center',
    flexWrap: 'nowrap',
    flexDirection: 'column',
  }),

  [`& .${classes.autoHeight}`]: (props) => ({
    height: 'auto',
    justifyContent: props.centered ? 'center' : 'flex-start',
    alignItems: 'center',
    flexWrap: 'nowrap',
    flexDirection: 'column',
  }),
}));

// hideEmployers set to true for participant-facing pages
export const Page = ({ children, hideEmployers = false, centered, isAutoHeight = false }) => {
  return (
    <Root>
      <Header hideEmployers={hideEmployers} />
      <Grid className={isAutoHeight ? classes.autoHeight : classes.root} container>
        {children}
      </Grid>
    </Root>
  );
};
