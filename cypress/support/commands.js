// These commands were sourced from the cypress-keycloak-login package
// XYZ
const crypto = require('crypto');

const getAuthCodeFromLocation = (location) => {
  let url = new URL(location);
  let params = url.search.substring(1).split('&');
  for (let _i = 0, params_1 = params; _i < params_1.length; _i++) {
    let param = params_1[_i];
    let _a = param.split('='),
      key = _a[0],
      value = _a[1];
    if (key === 'code') {
      return value;
    }
  }
};

const authBaseUrl = Cypress.env('KEYCLOAK_LOCAL_AUTH_URL') || Cypress.env('KEYCLOAK_AUTH_URL');

Cypress.Commands.add('kcLogout', function () {
  Cypress.log({ name: 'Logout' });
  let realm = Cypress.env('KEYCLOAK_REALM');
  return cy.request({
    url: `${authBaseUrl}/realms/${realm}/protocol/openid-connect/logout`,
  });
});

Cypress.Commands.add('kcLogin', (user) => {
  Cypress.log({ name: 'Login' });
  cy.fixture('users/' + user).then((userData) => {
    let realm = Cypress.env('KEYCLOAK_REALM');
    let client_id = Cypress.env('KEYCLOAK_API_CLIENTID');
    let client_secret = Cypress.env('KEYCLOAK_LOCAL_SECRET');

    const base64URLEncode = (str) => {
      return str.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    };

    const code_challenge = base64URLEncode(crypto.randomBytes(32));

    cy.request({
      url: authBaseUrl + '/realms/' + realm + '/protocol/openid-connect/auth',

      followRedirect: false,
      qs: {
        scope: 'openid',
        response_type: 'code',
        approval_prompt: 'auto',
        redirect_uri: Cypress.config('baseUrl'),
        client_id: client_id,
        client_secret: client_secret,
        code_challenge_method: 'plain',
        code_challenge,
      },
    })
      .then(function (response) {
        let html = document.createElement('html');
        html.innerHTML = response.body;
        let form = html.getElementsByTagName('form')[0];
        let url = form.action;
        return cy.request({
          method: 'POST',
          url: url,
          followRedirect: false,
          form: true,
          body: {
            username: userData.username,
            password: userData.password,
          },
        });
      })
      .then(function (response) {
        let code = getAuthCodeFromLocation(response.headers['location']);
        cy.request({
          method: 'post',
          url: authBaseUrl + '/realms/' + realm + '/protocol/openid-connect/token',
          body: {
            client_id: client_id,
            client_secret: client_secret,
            redirect_uri: Cypress.config('baseUrl'),
            code: code,
            code_verifier: code_challenge,
            grant_type: 'authorization_code',
          },
          form: true,
          followRedirect: false,
        }).its('body');
      });
  });
});

Cypress.Commands.add('kcLogout', function () {
  Cypress.log({ name: 'Logout' });
  let realm = Cypress.env('KEYCLOAK_REALM');
  return cy.request({
    url: `${authBaseUrl}/realms/${realm}/protocol/openid-connect/logout`,
  });
});

Cypress.Commands.add('callAPI', ({ api, method = 'POST', body, followRedirect = false }) => {
  Cypress.log({ name: 'call-api' });
  let realm = Cypress.env('KEYCLOAK_REALM');
  let client_id = Cypress.env('KEYCLOAK_API_CLIENTID');
  let client_secret = Cypress.env('KEYCLOAK_LOCAL_SECRET');

  // Get super user token
  cy.request({
    method: 'POST',
    url: `${authBaseUrl}/realms/${realm}/protocol/openid-connect/token`,
    followRedirect: false,
    form: true,
    body: {
      grant_type: 'password',
      client_id,
      scope: 'openid',
      client_secret,
      username: 'test-superuser',
      password: 'password',
    },
  }).then(({ body: respBody }) => {
    const accessToken = respBody.access_token;
    const apiBaseURL = Cypress.env('apiBaseURL');
    cy.request({
      url: `${apiBaseURL}${api}`,
      method,
      followRedirect,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
      body,
    });
  });
});
