import React from 'react';
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';
import { useKeycloak } from '@react-keycloak/web';
import { Page, Button } from '../../components/generic';

export default () => {
  const [keycloak, initialized] = useKeycloak();

  return (
    <Page >
      <Grid container alignItems="center" justify="center" >
        <Grid item xs={12} sm={8} md={6} lg={4} xl={3}>
          <Box m={2}>
            <Grid item xs={12}>
              <Button
                type="submit"
                text="Login"
                size="large"
                onClick={() => keycloak.login({ redirectUri: 'http://localhost:4000/admin' })}
              />
            </Grid>
          </Box>
        </Grid>
      </Grid>
    </Page>
  );
};
