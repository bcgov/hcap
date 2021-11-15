import React from 'react';
import { Page } from '../../components/generic';
import { DisabledLanding } from '../../components/participant-form/DisabledLanding';

export default () => {
  return (
    <Page hideEmployers={!window.location.hostname.includes('freshworks.club')}>
      <DisabledLanding />
    </Page>
  );
};
