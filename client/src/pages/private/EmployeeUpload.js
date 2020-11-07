import React from 'react';
import Grid from '@material-ui/core/Grid';
import { Box, Typography } from '@material-ui/core';
import { DropzoneArea } from 'material-ui-dropzone';
import { makeStyles } from '@material-ui/core/styles';
import { Page, Button } from '../../components/generic';
import store from 'store';

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

  const classes = useStyles();

  const handleSubmit = async () => {

    const response = await fetch('/api/v1/employee-upload-file', {
      headers: {
        'Accept': 'application/json',
        'Content-type': 'application/json',
        'Authorization': `Bearer ${store.get('TOKEN')}`,
      },
      method: 'POST',
    });

    if (response.ok) {
      const { result } = await response.json();
      console.log(result);
      return;
    }
  };

  const handleChange = (files) => {
    const file = files[0];
    console.log(file);
  };

  return (
    <Page >
      <Grid container alignContent="center" justify="center" alignItems="center" direction="column">
        <Typography variant="subtitle1" gutterBottom>
          Please upload pre-screened applicants:
        </Typography>
        <Box pt={4} pb={4} pl={4} pr={4}>
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
            dropzoneText="Drop your employee sheet here or click"
          />
        </Box>
        <Box pb={4} pl={4} pr={4}>
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
