// Participant Details Page
// Dependency
import React/*, { useEffect, useState }*/ from 'react';
import { useParams } from 'react-router-dom';

// Libs
import { Page, CheckPermissions } from '../../components/generic';

export default () => {
  // Get param
  const { id } = useParams();
  // Render
  return (<Page>
    <CheckPermissions permittedRoles={['employer', 'health_authority', 'ministry_of_health']}>
      <div>Participant details of id: { id }</div>
    </CheckPermissions>
  </Page>)
}