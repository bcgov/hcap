import React from 'react';

import { Page } from '../../components/generic';
import { Form } from '../../components/participant-form';

export default () => {
  return (
    <Page hideEmployers={!window.location.hostname.includes('freshworks.club')}>
      <Form />
    </Page>
  );
};
