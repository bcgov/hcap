import React from 'react';

import { Box, Link } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  toolbar: {
    backgroundColor: theme.palette.primary.light,
    width: '100%',
    borderTop: `2px solid ${theme.palette.secondary.main}`,
  },
  linkBox: {
    borderRight: `1px solid ${theme.palette.default.white}`,
  },
  linkText: {
    textDecoration: 'none',
    color: theme.palette.default.white,
    fontSize: '15px',
  },
}));

export default () => {
  const classes = useStyles();
  // TODO: update footer links
  const links = [
    {
      name: 'Home',
      href: '#',
    },
    {
      name: 'About gov.bc.ca',
      href: '#',
    },
    {
      name: 'Disclaimer',
      href: '#',
    },
    {
      name: 'Accessibility',
      href: '#',
    },
    {
      name: 'Copyright',
      href: '#',
    },
    {
      name: 'Contact Us',
      href: '#',
    },
  ];

  return (
    <React.Fragment>
      <Box px={5} py={2} className={classes.toolbar} display='flex'>
        {links.map((link, ind) => (
          <Box key={ind} px={2} className={ind === links.length - 1 ? '' : classes.linkBox}>
            <Link className={classes.linkText} href={link.href}>
              {link.name}
            </Link>
          </Box>
        ))}
      </Box>
    </React.Fragment>
  );
};
