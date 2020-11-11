import Keycloak from 'keycloak-js';

// Get realm info for the current deployment env, which is passed through the BE
const getRealmInfo = async () => {
  const response = await fetch('/api/v1/keycloak-realm-client-info', {
    headers: {
      'Accept': 'application/json',
      'Content-type': 'application/json',
    },
    method: 'GET',
  });

  return response;
};


export default () => {
  let realmInfo = getRealmInfo();

  const keycloak = new Keycloak({
    realm: realmInfo.realm,
    url: realmInfo.url,
    clientId: realmInfo.clientId
  });
};
