import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Paper, Grid, Icon, Link, styled } from '@mui/material';
import FindInPageOutlinedIcon from '@mui/icons-material/FindInPageOutlined';
import { Button } from '../../components/generic';
import { Routes, HCAP_LINK } from '../../constants';

const StyledCard = styled(Paper)(({ theme }) => ({
  maxWidth: '70%',
  padding: 30,
  marginTop: 40,
  textAlign: 'center',
}));

const TextBlock = styled(Typography)(({ theme }) => ({
  paddingBlock: 10,
}));

const StyledIcon = styled(Icon)(({ theme }) => ({
  height: '100%',
  width: '100%',
  maxWidth: '70px',
}));

export default () => {
  const navigate = useNavigate();

  return (
    <StyledCard elevation={3}>
      <Grid spacing={2} alignItems='center' container>
        <Grid item xs={12}>
          <StyledIcon component={FindInPageOutlinedIcon} fontSize='large' />
        </Grid>

        <Grid item xs={12}>
          <Typography variant='h2'>
            You haven't submitted your <br /> Participant Expression of Interest
          </Typography>
          <TextBlock align='center'>
            If you haven't submitted an Expression of Interest form, please click on the button
            below to submit one. For more information, please visit the{' '}
            <Link href={HCAP_LINK}>Health Career Access Program website.</Link>
          </TextBlock>
        </Grid>

        <Grid item xs={12}>
          <Button
            text='Submit Participant Expression of Interest'
            fullWidth={false}
            onClick={() => {
              navigate(Routes.Base);
            }}
          />
        </Grid>
      </Grid>
    </StyledCard>
  );
};
