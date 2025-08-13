import React from 'react';

import { Box, Link } from '@mui/material';

import {
  ACCESSABILITY_LINK,
  HOME_LINK,
  ABOUT_GOV_BC_LINK,
  DISCLAIMER_LINK,
  PRIVACY_LINK,
  COPYRIGHT_LINK,
} from '../../constants';

export const Footer = () => {
  const links = [
    {
      name: 'Home',
      href: HOME_LINK,
    },
    {
      name: 'About gov.bc.ca',
      href: ABOUT_GOV_BC_LINK,
    },
    {
      name: 'Disclaimer',
      href: DISCLAIMER_LINK,
    },
    {
      name: 'Privacy',
      href: PRIVACY_LINK,
    },
    {
      name: 'Accessibility',
      href: ACCESSABILITY_LINK,
    },
    {
      name: 'Copyright',
      href: COPYRIGHT_LINK,
    },
  ];

  return (
    <React.Fragment>
      <Box
        px={5}
        py={2}
        display='flex'
        sx={{
          backgroundColor: 'primary.light',
          width: '100%',
          borderTop: 2,
          borderTopColor: 'secondary.main',
          marginTop: 'auto',
        }}
      >
        {links.map((link, ind) => (
          <Box
            key={ind}
            px={2}
            sx={{
              borderRight: ind === links.length - 1 ? 'none' : 1,
              borderRightColor: 'default.white',
            }}
          >
            <Link
              href={link.href}
              target='_blank'
              sx={{
                textDecoration: 'none',
                color: 'default.white',
                fontSize: '15px',
              }}
            >
              {link.name}
            </Link>
          </Box>
        ))}
      </Box>
    </React.Fragment>
  );
};
