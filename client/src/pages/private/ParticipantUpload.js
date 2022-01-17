import React, { useState } from 'react';
import { styled } from '@mui/material/styles';
import { useHistory } from 'react-router-dom';
import Grid from '@mui/material/Grid';
import { Box, Typography } from '@mui/material';
import { Page, Button, CheckPermissions } from '../../components/generic';
import store from 'store';
import Alert from '@mui/material/Alert';
import { API_URL, Routes } from '../../constants';

const PREFIX = 'ParticipantUpload';

const classes = {
  dropzone: `${PREFIX}-dropzone`,
  dropzoneText: `${PREFIX}-dropzoneText`,
  previewChip: `${PREFIX}-previewChip`,
};

const StyledPage = styled(Page)(({ theme }) => ({
  [`& .${classes.dropzone}`]: {
    backgroundColor: theme.palette.gray.primary,
    padding: theme.spacing(3),
    marginBottom: theme.spacing(2),
  },

  [`& .${classes.dropzoneText}`]: {
    color: theme.palette.text.secondary,
    fontSize: theme.typography.button.fontSize,
  },

  [`& .${classes.previewChip}`]: {
    minWidth: 160,
    maxWidth: 210,
  },
}));

export default () => {
  const [file, setFile] = useState();
  const [isLoadingData, setLoadingData] = useState(false);
  const [errors, setErrors] = useState([]);

  const history = useHistory();

  const handleSubmit = async () => {
    setLoadingData(true);
    const data = new FormData();
    data.append('file', file);
    const response = await fetch(`${API_URL}/api/v1/participants/batch`, {
      headers: {
        Authorization: `Bearer ${store.get('TOKEN')}`,
      },
      method: 'POST',
      body: data,
    });

    setLoadingData(false);
    if (response.ok) {
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
    }
  };

  const handleChange = (files) => {
    setFile(files[0]);
    setErrors([]);
  };

  return (
    <StyledPage>
      <CheckPermissions permittedRoles={['maximus']} renderErrorMessage={true}>
        <Grid
          container
          alignContent='center'
          justifyContent='center'
          alignItems='center'
          direction='column'
        >
          <Typography variant='subtitle1' gutterBottom>
            Please upload pre-screened participants:
          </Typography>
          <Box pt={4} pl={4} pr={4}>
            {/* <DropzoneArea
              useChipsForPreview
              previewText='Selected file:'
              previewGridProps={{ container: { spacing: 1, direction: 'row' } }}
              previewChipProps={{  { root: classes.previewChip } }}
              showPreviews={true}
              showPreviewsInDropzone={false}
              onChange={handleChange}
              maxFileSize={5000000}
              filesLimit={1}
              dropzoneClass={classes.dropzone}
              dropzoneParagraphClass={classes.dropzoneText}
              dropzoneText='Drop your participant sheet here or click the box'
            /> */}
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
    </StyledPage>
  );
};
