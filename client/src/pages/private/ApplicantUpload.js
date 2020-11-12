import React, { useState } from 'react';
import Grid from '@material-ui/core/Grid';
import { Box, Typography } from '@material-ui/core';
import { DropzoneArea } from 'material-ui-dropzone';
import { makeStyles } from '@material-ui/core/styles';
import { Page, Button } from '../../components/generic';
import store from 'store';
import Alert from '@material-ui/lab/Alert';

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

export default () => {

  const [file, setFile] = useState();
  const [success, setSuccess] = useState();
  const [errors, setErrors] = useState([]);
  const classes = useStyles();

  const handleSubmit = async () => {
    const data = new FormData();
    data.append('file', file);
    const response = await fetch('/api/v1/employees', {
      headers: {
        'Authorization': `Bearer ${store.get('TOKEN')}`,
      },
      method: 'POST',
      body: data,
    });

    if (response.ok) {
      const { error } = await response.json();
      if (error) {
        setErrors(error);
      } else {
        setFile(null);
        setSuccess('Applicants successfully uploaded.');
      }
      return;
    }
  };

  const handleChange = (files) => {
    setFile(files[0]);
    setSuccess(null);
    setErrors([]);
  };

  return (
    <Page >
      <Grid container alignContent="center" justify="center" alignItems="center" direction="column">
        <Typography variant="subtitle1" gutterBottom>
          Please upload pre-screened applicants:
        </Typography>
        <Box pt={4} pl={4} pr={4}>
          <DropzoneArea
            useChipsForPreview
            previewText="Selected file:"
            previewGridProps={{ container: { spacing: 1, direction: 'row' } }}
            previewChipProps={{ classes: { root: classes.previewChip } }}
            showPreviews={true}
            showPreviewsInDropzone={false}
            onChange={handleChange}
            maxFileSize={5000000}
            filesLimit={1}
            dropzoneClass={classes.dropzone}
            dropzoneParagraphClass={classes.dropzoneText}
            dropzoneText="Drop your applicant sheet here or click the box"
          />
        </Box>
        <Box pl={4} pr={4} pt={2}>
          {
            errors.length > 0 ?
              errors.map(
                (item, index) => <Alert key={index} severity="error">{item}</Alert>
              )
              :
              success ?
                <Alert severity="success">{success}</Alert>
                : null
          }
        </Box>
        <Box pb={4} pl={4} pr={4} pt={2}>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!file || errors.length > 0}
            color="primary"
            fullWidth={false}
            text="Upload"
          />
        </Box>
      </Grid>
    </Page>
  );
};
