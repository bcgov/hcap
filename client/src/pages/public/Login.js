import React, { useState } from 'react';
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';
import { Formik, Form, Field } from 'formik';
import { useHistory } from 'react-router-dom';

import { LoginSchema, Routes, ToastStatus } from '../../constants';
import { useToast } from '../../hooks';

import { Page, Button, Card } from '../../components/generic';
import { RenderTextField } from '../../components/fields';

export default () => {
  const history = useHistory();

  const { openToast } = useToast();
  const [isLoading, setLoading] = useState(false);
  const initialValues = {
    username: '',
    password: '',
  };

  const handleSubmit = async (values) => {
    setLoading(true);

    const response = await fetch('/api/v1/login', {
      headers: { 'Accept': 'application/json', 'Content-type': 'application/json' },
      method: 'POST',
      body: JSON.stringify({ ...values })
    });

    if (response.ok) {
      const { token } = await response.json();
      window.localStorage.setItem('jwt', token);
      history.push(Routes.Submissions);
    } else {
      openToast({ status: ToastStatus.Error, message: response.error || response.statusText || response });
      setLoading(false);
    }
  };

  return (
    <Page>
      <Grid container alignItems="center" justify="center" >
        <Grid item xs={12} sm={8} md={6} lg={4} xl={3}>
          <Box m={2}>
            <Card title="Provincial Official Login">
              <Formik
                initialValues={initialValues}
                validationSchema={LoginSchema}
                onSubmit={handleSubmit}
              >
                <Form>
                  <Grid container spacing={3}>

                    {/** Username */}
                    <Grid item xs={12}>
                      <Field
                        name="username"
                        component={RenderTextField}
                        label="Username"
                      />
                    </Grid>

                    {/** Password */}
                    <Grid item xs={12}>
                      <Field
                        name="password"
                        component={RenderTextField}
                        label="Password"
                        type="password"
                      />
                    </Grid>

                    {/** Submit */}
                    <Grid item xs={12}>
                      <Button
                        type="submit"
                        text="Login"
                        size="large"
                        loading={isLoading}
                      />
                    </Grid>
                  </Grid>
                </Form>
              </Formik>
            </Card>
          </Box>
        </Grid>
      </Grid>
    </Page>
  );
};
