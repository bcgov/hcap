import React from 'react';
import { useHistory } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import { Typography, Paper, Grid, Icon, Link } from '@material-ui/core';
import { Button } from '../../components/generic';
import { Routes, HCAP_LINK, HCAP_INFO_EMAIL } from '../../constants';
import FindInPageOutlinedIcon from '@material-ui/icons/FindInPageOutlined';

const useStyles = makeStyles(() => ({
  card: {
    maxWidth: '70%',
    align: 'center',
    padding: 30,
    marginTop: 40,
  },
  text_block: {
    paddingBlock: 10,
  },
  icon: {
    height: '100%',
    width: '100%',
    maxWidth: '70px',
  },
}));

export default () => {
  const histroy = useHistory();
  const classes = useStyles();
  return (
    <Paper className={classes.card} elevation={3}>
      <Grid spacing={2} alignItems={'center'} container>
        <Grid item align={'center'} xs={12}>
          <Icon
            component={FindInPageOutlinedIcon}
            fontSize={'large'}
            className={classes.icon}
          ></Icon>
        </Grid>
        <Grid item align={'center'} xs={12}>
          <Typography variant={'h2'}>
            You haven't submitted your <br /> Participant Expression of Interest
          </Typography>
          <Typography align={'center'} className={classes.text_block}>
            If you think this is a mistake please contact us at{' '}
            <Link href={`mailto:${HCAP_INFO_EMAIL}`}>{HCAP_INFO_EMAIL}</Link>. If you haven't
            submitted an Expression of Interest form, please click on the button below to submit
            one. For more information, please visit the{' '}
            <Link href={HCAP_LINK}>Health Career Access Program website.</Link>
          </Typography>
        </Grid>

        <Grid item align={'center'} xs={12}>
          <Button
            text={'Submit Participant Expression of Interest'}
            fullWidth={false}
            onClick={() => {
              histroy.push(Routes.Base);
            }}
          />
        </Grid>
      </Grid>
    </Paper>
  );
};
