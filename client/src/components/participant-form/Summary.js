import React, { Fragment } from 'react';
import Typography from '@material-ui/core/Typography';
import Link from '@material-ui/core/Link';
import {
  HEALTH_CARE_ASSISTANT_LINK,
  MENTAL_HEALTH_AND_ADDICTIONS_WORKER_LINK,
} from '../../constants';

const Summary = () => {
  return (
    <Fragment>
      <Typography variant='h2' color='primary' gutterBottom>
        Health Career Access Program - Expression of Interest
      </Typography>
      <Typography variant='body1' gutterBottom>
        The Health Career Access Program (HCAP) is a fully funded route for applicants with little
        to no health care experience to enter the health care sector.
      </Typography>
      <br />
      <Typography variant='body1'>
        There are two different HCAP streams available, to train as either a:
        <ol>
          <li>
            <Link href={HEALTH_CARE_ASSISTANT_LINK} target='__blank' rel='noreferrer noopener'>
              Health Care Assistant
            </Link>{' '}
            or
          </li>
          <li>
            <Link
              href={MENTAL_HEALTH_AND_ADDICTIONS_WORKER_LINK}
              target='__blank'
              rel='noreferrer noopener'
            >
              Mental Health and Addictions Worker
            </Link>
          </li>
        </ol>
      </Typography>
      <Typography variant='body1'>
        Click on the links above to review the background and eligibility criteria for the specific
        program you're applying for. If interested, use this expression of interest form to apply.
      </Typography>
    </Fragment>
  );
};

export { Summary };
