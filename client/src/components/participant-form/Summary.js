import React, { Fragment } from 'react';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';

const Summary = () => {
  return (
    <Fragment>
      <Typography variant='h2' color='primary' gutterBottom>
        Health Career Access Program - Expression of Interest
      </Typography>
      <Typography variant='body1'>
        Complete this expression of interest form if you want to join the&nbsp;
        <Link href='https://gov.bc.ca/careersinhealth' target='__blank' rel='noreferrer noopener'>
          Health Career Access Program
        </Link>
      </Typography>
    </Fragment>
  );
};

export { Summary };
