import React, { useEffect, useState } from 'react';
import Grid from '@material-ui/core/Grid';
import { Page, CheckPermissions } from '../../components/generic';
import { Form } from '../../components/employer-form';
import { Role } from '../../constants';
import { getErrorMessage, scrollUp } from '../../utils';
import { axiosInstance } from '../../services/api';
import { useToast } from '../../hooks';

export default ({ match }) => {
  const { openToast } = useToast();

  const [user, setUser] = useState(undefined);
  const expressionID = match.params.id;

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const { data } = await axiosInstance.get(`/employer-form/${expressionID}`);
        setUser(data);
      } catch (e) {
        openToast(getErrorMessage(e));
      }
    };

    fetchDetails();
  }, [expressionID]);

  scrollUp();
  return (
    <Page>
      <CheckPermissions
        permittedRoles={[Role.HealthAuthority, Role.MinistryOfHealth]}
        renderErrorMessage={true}
      >
        <Grid item xs={12} sm={11} md={10} lg={8} xl={6}>
          <Form initialValues={user} hideCollectionNotice isDisabled />
        </Grid>
      </CheckPermissions>
    </Page>
  );
};
