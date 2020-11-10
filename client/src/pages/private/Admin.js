import React, { useState } from 'react';
import Grid from '@material-ui/core/Grid';
import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Page, Button } from '../../components/generic';

const useStyles = makeStyles((theme) => ({
  dropzone: {
    backgroundColor: theme.palette.gray.primary,
    padding: theme.spacing(3),
    marginBottom: theme.spacing(2),
  },
  dropzoneText: {
    color: theme.palette.text.secondary,
    fontSize: theme.typography.button.fontSize,
  },
  previewChip: {
    minWidth: 160,
    maxWidth: 210
  },
}));

// eslint-disable-next-line import/no-anonymous-default-export
export default () => {

  const [success, setSuccess] = useState();
  const [errors, setErrors] = useState([]);
  const classes = useStyles();

  const handleSubmit = async () => {
    
  };

  return (
    <Page >
      <Grid container alignContent="center" justify="center" alignItems="center" direction="column">
        <Typography variant="subtitle1" gutterBottom>
          Select:
        </Typography>
        <Box pb={4} pl={4} pr={4} pt={2}>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            fullWidth={false}
            text="Upload"
          />
        </Box>
      </Grid>
    </Page>
  );
};
