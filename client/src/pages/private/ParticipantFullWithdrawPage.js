import React from 'react';
import { Grid, Typography, styled } from '@mui/material';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import { Button } from '../../components/generic';
import { Page } from '../../components/generic';
import { useNavigate } from 'react-router-dom';
import { Routes } from '../../constants';

const RootGrid = styled(Grid)(({ theme }) => ({
  maxWidth: '60%',
  paddingTop: 100,
  flexGrow: 1,
}));

const CenteredText = styled(Typography)(({ theme }) => ({
  [theme.breakpoints.up('md')]: {
    textAlign: 'center',
  },
}));

const InfoBox = styled(Grid)(({ theme }) => ({
  color: 'rgb(13, 60, 97)',
  borderRadius: '4px',
  border: '1px solid rgb(175, 217, 252)',
  padding: 20,
  marginTop: 20,
  marginBottom: 20,
  backgroundColor: 'rgb(230,246,255)',
  maxWidth: '600px',
}));

const StyledMailIcon = styled(MailOutlineIcon)(({ theme }) => ({
  width: '100%',
  height: '100%',
  fontSize: theme.breakpoints.up('md') ? 'large' : 'small',
}));

export default () => {
  const navigate = useNavigate();
  return (
    <Page>
      <RootGrid container alignContent='center' direction='column'>
        <Grid item>
          <CenteredText variant='h4'>You have withdrawn from HCAP</CenteredText>
        </Grid>

        <Grid item>
          <CenteredText>
            You have successfully withdrawn from the program. <br />
            If you wish to rejoin the program please submit another Participant Expression of
            Interest form.
          </CenteredText>
        </Grid>

        <Button
          text='Submit Expression of Interest'
          fullWidth={false}
          style={{ marginTop: '20px' }}
          onClick={() => navigate(Routes.Base)}
        />

        <InfoBox item container spacing={2}>
          <Grid item xs={2}>
            <StyledMailIcon />
          </Grid>
        </InfoBox>
      </RootGrid>
    </Page>
  );
};
