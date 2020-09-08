import React, { Fragment } from 'react';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import Link from '@material-ui/core/Link';

import { Card, Button } from '../generic';

const Footer = () => {
  return (
    <Fragment>
      <Card>
        <Box textAlign="center" padding="1rem">
          <Typography variant="subtitle1" gutterBottom>
            Need Assistance?
          </Typography>

          <Typography variant="body2" paragraph>
            <b>Service is available 7:30 am to 8 pm Pacific Time</b>
          </Typography>

          <Button
            variant="outlined"
            fullWidth={false}
            text={(
              <Fragment>
                Call&nbsp;<Link href="tel:+18882684319">1-888-268-4319</Link>
              </Fragment>
            )}
          />
        </Box>
      </Card>
    </Fragment>
  );
};

export { Footer };
