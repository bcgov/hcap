// These commands were sourced from the cypress-keycloak-login package
const utils_1 = require('./utils');
const { v4 } = require('uuid');
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

// also no longer useful
Cypress.Commands.add('kcGetToken', function (user) {
  Cypress.log({ name: 'Login' });
  cy.fixture('users/' + user).then(function (userData) {
    userData.password ? null : (userData.password = Cypress.env('KEYCLOAK_SA_PASSWORD'));
    let authBaseUrl = Cypress.env('KEYCLOAK_AUTH_URL');
    let realm = Cypress.env('KEYCLOAK_REALM');
    let client_id = Cypress.env('KEYCLOAK_FE_CLIENTID');
    cy.request({
      method: 'POST',
      url: authBaseUrl + '/realms/' + realm + '/protocol/openid-connect/token',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      followRedirect: false,
      body: {
        grant_type: 'password',
        client_id: client_id,
        client_secret: Cypress.env('KEYCLOAK_API_CLIENTID'),
        username: userData.username,
        password: userData.password,
      },
    }).then(function (response) {
      window.localStorage.setItem('TOKEN', response.body.access_token);
      return response.body.access_token;
    });
  });
});

Cypress.Commands.add('kcLogout', function () {
  Cypress.log({ name: 'Logout' });
  let authBaseUrl = Cypress.env('KEYCLOAK_AUTH_URL');
  let realm = Cypress.env('KEYCLOAK_REALM');
  return cy.request({
    url: `${authBaseUrl}/realms/${realm}/protocol/openid-connect/logout`,
  });
});

Cypress.Commands.add('kcLogin', (user) => {
  Cypress.log({ name: 'Login' });
  cy.fixture('users/' + user).then((userData) => {
    let authBaseUrl = Cypress.env('KEYCLOAK_AUTH_URL');
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
            client_secret,
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
  let authBaseUrl = Cypress.env('KEYCLOAK_AUTH_URL');
  let realm = Cypress.env('KEYCLOAK_REALM');
  return cy.request({
    url: `${authBaseUrl}/realms/${realm}/protocol/openid-connect/logout`,
  });
});

// Trying to phase this one out of existence
Cypress.Commands.add('kcNavAs', function (user, visitUrl) {
  visitUrl = visitUrl || '';
  Cypress.log({ name: 'Fake Login' });
  let authBaseUrl = Cypress.env('KEYCLOAK_AUTH_URL');
  let realm = Cypress.env('KEYCLOAK_REALM');
  let access_token = Cypress.env('ACCESS_TOKEN');
  let refresh_token = Cypress.env('REFRESH_TOKEN');
  let id_token = Cypress.env('ID_TOKEN');
  let state = v4();
  let nonce = utils_1.decodeToken(access_token).nonce;
  let token = {
    access_token: access_token,
    expires_in: 300,
    refresh_expires_in: 1800,
    refresh_token: refresh_token,
    token_type: 'bearer',
    id_token: id_token,
    'not-before-policy': 0,
    session_state: v4(),
    scope: 'openid',
  };

  let localStorageObj = {
    state: state,
    nonce: nonce,
    expires: Date() + 3600,
  };
  const localStorageKey = `kc-callback-${state}`;

  const sites = [
    {
      city: 'Prince Rupert',
      siteId: 2,
      address: '90 Test Ave',
      siteName: 'Home Sweet Home',
      postalCode: 'A1A 2B2',
      operatorName: 'Home Sweet Home',
      operatorEmail: 'hannah123@test.com',
      operatorPhone: '1234567890',
      healthAuthority: 'Northern',
      siteContactLastName: 'Homebody',
      siteContactFirstName: 'Hannah',
      allocation: 10,
      registeredBusinessName: 'HOME SWEET HOME, HOME SERVICES',
      siteContactPhoneNumber: '1234567890',
      operatorContactLastName: 'Homebody',
      siteContactEmailAddress: 'hannah123@test.com',
      operatorContactFirstName: 'Hannah',
      id: 1,
      created_at: '2021-01-26T17:22:43.800Z',
      updated_at: null,
    },
  ];

  const today = new Date();
  const yesterday = new Date(today);
  const twoWeeksAgo = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const participants = [
    {
      id: 1,
      emailAddress: 'tasty@snac.ks',
      username: 'graham',
      firstName: 'Graham',
      lastName: 'Crackers',
      phoneNumber: 1112223333,
      createdAt: '2020-11-12 18:33',
      userUpdatedAt: yesterday.toDateString(),
      postalCode: 'V1V1V1',
    },
    {
      id: 2,
      emailAddress: 'white@pine.grove',
      username: 'whitepine',
      firstName: 'White',
      lastName: 'Pine',
      phoneNumber: 1112223333,
      createdAt: '2020-11-12 18:33',
      userUpdatedAt: twoWeeksAgo.toDateString(),
      postalCode: 'V1V1V1',
    },
  ];

  // This function defines the values that will be returned from the call to
  // /protocol/openid-connect/auth
  //
  const userInfo = (userType) => {
    let jsonOutput = {
      name: 'Test User',
      pagination: {
        offset: 0,
        total: 0,
      },
      roles: [],
      data: participants,
    };

    if (userType.includes('superuser')) {
      jsonOutput.name = 'Test Superuser';
      jsonOutput.roles.push(
        'superuser',
        'region_vancouver_island',
        'region_fraser',
        'region_interior',
        'region_northern',
        'region_vancouver_coastal'
      );
    }

    if (userType.includes('ministry_of_health')) {
      jsonOutput.name = 'Test MoH';
      jsonOutput.roles.push(
        'ministry_of_health',
        'region_vancouver_island',
        'region_fraser',
        'region_interior',
        'region_northern',
        'region_vancouver_coastal'
      );
    }

    if (userType.includes('health_authority')) {
      jsonOutput.name = 'Test Health Authority';
      jsonOutput.roles.push('health_authority');
    }

    if (userType.includes('employer')) {
      jsonOutput.name = 'Test Employer';
      jsonOutput.roles.push('employer');
    }

    if (userType.includes('MoH')) {
      jsonOutput.name = 'Test MoH';
      jsonOutput.roles.push('ministry_of_health');
    }

    if (userType.includes('island')) {
      jsonOutput.roles.push('region_vancouver_island');
    }

    if (userType.includes('fraser')) {
      jsonOutput.roles.push('region_fraser');
    }

    if (userType.includes('northern')) {
      jsonOutput.roles.push('region_northern');
    }

    if (userType.includes('coastal')) {
      jsonOutput.roles.push('region_vancouver_coastal');

      if (userType.includes('interior')) {
        jsonOutput.roles.push('region_interior');
      }
    }

    return jsonOutput;
  };

  window.localStorage.setItem(localStorageKey, JSON.stringify(localStorageObj));
  cy.intercept('post', `${authBaseUrl}/realms/${realm}/protocol/openid-connect/token`, token);
  cy.intercept(
    'get',
    `${authBaseUrl}/realms/${realm}/protocol/openid-connect/auth`,
    userInfo(user)
  );
  cy.intercept('get', 'api/v1/employer-sites', { data: sites });
  cy.intercept('get', 'api/v1/user', { sites: [2], roles: userInfo(user).roles });
  cy.intercept(
    'get',
    `/api/v1/participant?id=1`,
    participants.filter((ppnt) => ppnt.id === 1)
  );

  const url = new URL(
    `${Cypress.config().baseUrl}/${visitUrl}#state=${state}&session_state=${v4()}&code=${v4()}`
  );
  cy.visit(url.toString());
});
