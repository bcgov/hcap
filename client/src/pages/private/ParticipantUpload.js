import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import Grid from '@material-ui/core/Grid';
import { Box, Typography } from '@material-ui/core';
import { DropzoneArea } from 'material-ui-dropzone';
import { makeStyles } from '@material-ui/core/styles';
import { Page, Button, CheckPermissions } from '../../components/generic';
import store from 'store';
import Alert from '@material-ui/lab/Alert';
import { API_URL, Routes } from '../../constants';

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
    maxWidth: 210,
  },
}));

export default () => {
  const [file, setFile] = useState();
  const [isLoadingData, setLoadingData] = useState(false);
  const [errors, setErrors] = useState([]);
  const classes = useStyles();
  const history = useHistory();

  const handleSubmit = async () => {
    setLoadingData(true);
    // legacy endpoint
    /* const data = new FormData();
    data.append('file', file);
    const response = await fetch(`${API_URL}/api/v1/participants/batch`, {
      headers: {
        Authorization: `Bearer ${store.get('TOKEN')}`,
      },
      method: 'POST',
      body: data,
    }); */

    setLoadingData(false);
    /* if (response.ok) {
      const result = await response.json();
      setFile(null);
      if (Array.isArray(result)) {
        history.push(Routes.ParticipantUploadResults, { results: result });
      } else {
        setErrors([result.message]);
      }
    } else {
      const message = await response.text();
      setErrors([message]);
    } */
  };

  const handleChange = (files) => {
    setFile(files[0]);
    setErrors([]);
  };

  return (
    <Page>
      <CheckPermissions permittedRoles={['maximus']} renderErrorMessage={true}>
        <Grid
          container
          alignContent='center'
          justify='center'
          alignItems='center'
          direction='column'
        >
          <Typography variant='subtitle1' gutterBottom>
            Please upload pre-screened participants:
          </Typography>
          <Box pt={4} pl={4} pr={4}>
            <DropzoneArea
              useChipsForPreview
              previewText='Selected file:'
              previewGridProps={{ container: { spacing: 1, direction: 'row' } }}
              previewChipProps={{ classes: { root: classes.previewChip } }}
              showPreviews={true}
              showPreviewsInDropzone={false}
              onChange={handleChange}
              maxFileSize={5000000}
              filesLimit={1}
              dropzoneClass={classes.dropzone}
              dropzoneParagraphClass={classes.dropzoneText}
              dropzoneText='Drop your participant sheet here or click the box'
            />
          </Box>
          <Box pl={4} pr={4} pt={2}>
            {errors.length > 0 &&
              errors.map((item, index) => (
                <Alert key={index} severity='error'>
                  {item}
                </Alert>
              ))}
          </Box>
          <Box pb={4} pl={4} pr={4} pt={2}>
            <Button
              onClick={handleSubmit}
              loading={isLoadingData}
              variant='contained'
              disabled={!file || errors.length > 0}
              color='primary'
              fullWidth={false}
              text='Upload'
            />
          </Box>
        </Grid>
      </CheckPermissions>
    </Page>
  );
};
