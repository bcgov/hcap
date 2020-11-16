import React from 'react';
import Grid from '@material-ui/core/Grid';
import { Routes } from '../../constants';
import { useLocation, Redirect } from 'react-router-dom';
import { Page } from '../../components/generic';
import { Form } from '../../components/employer-form';

export default () => {
  const location = useLocation();
  if (!location.state) return <Redirect to={Routes.EOIView} />
  return (
    <Page>
      <Grid item xs={12} sm={11} md={10} lg={8} xl={6}>
        <Form
          initialValues={location.state?.item}
          hideCollectionNotice
          isDisabled
        />
      </Grid>
    </Page>
  );
};
