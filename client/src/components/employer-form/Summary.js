import React, { Fragment } from 'react';
import Typography from '@material-ui/core/Typography';

const Summary = () => {
  return (
    <Fragment>
      <Typography variant="h2" color="primary" gutterBottom>
        Health Career Access Program - Employer Form
      </Typography>
      <Typography variant="subtitle2" color="primary" gutterBottom>
        Before you complete your form
      </Typography>
      <Typography variant="body1" gutterBottom>
        <b>Collection Notice</b>
      </Typography>
      <Typography variant="body1">
        Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam
        rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt
        explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia
        consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui
        dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora
        incidunt ut labore et dolore magnam aliquam quaerat voluptatem.
      </Typography>
    </Fragment>
  );
};

export { Summary };
