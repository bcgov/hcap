// These commands were sourced from the cypress-keycloak-login package
const crypto = require('crypto');

// relative paths to test data, used with command `cy.getCSVData`
const CSVPaths = {
  cohortParticipants: 'server/test-data/cohort_participants.csv',
  cohorts: 'server/test-data/cohorts.csv',
  psi: 'server/test-data/post_secondary_institutions.csv',
  phases: 'server/test-data/phases.csv',
};

const getAuthCodeFromLocation = (location) => {
  try {
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
  } catch (e) {
    cy.log(e);
    return '';
  }
};

const authBaseUrl = Cypress.env('KEYCLOAK_LOCAL_AUTH_URL') || Cypress.env('KEYCLOAK_AUTH_URL');

const localLogin = (user) => {
  cy.fixture('users/' + user).then((userData) => {
    let realm = Cypress.env('KEYCLOAK_LOCAL_REALM');
    let client_id = Cypress.env('KEYCLOAK_LOCAL_API_CLIENTID');

    const base64URLEncode = (str) => {
      return str.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    };

    const code_challenge = base64URLEncode(crypto.randomBytes(32));
    const authCompleteUrl = authBaseUrl + '/realms/' + realm + '/protocol/openid-connect/auth';
    const queryObject = {
      client_id: client_id,
      redirect_uri: 'http%3A%2F%2Fhcapemployers.local.freshworks.club%3A4000%2Fkeycloak',
      response_mode: 'fragment',
      response_type: 'code',
      scope: 'openid',
      code_challenge,
      code_challenge_method: 'S256',
    };
    const queryString = Object.keys(queryObject)
      .map(function (key) {
        return key + '=' + queryObject[key];
      })
      .join('&');
    const url = authCompleteUrl + '?' + queryString;
    cy.request({
      url,
      followRedirect: true,
    })
      .then(function (response) {
        let html = document.createElement('html');
        html.innerHTML = response.body;
        let form = html.getElementsByTagName('form')[0];
        let url = form.action;
        return cy.request({
          method: 'POST',
          url: url,
          followRedirect: true,
          form: true,
          body: {
            username: userData.username,
            password: userData.password,
          },
        });
      })
      .then(function (response) {
        expect(response.status).equal(200);
      });
  });
};

const pipelineLogin = (user) => {
  cy.fixture('users/' + user).then((userData) => {
    let realm = Cypress.env('KEYCLOAK_LOCAL_REALM');
    let client_id = Cypress.env('KEYCLOAK_LOCAL_API_CLIENTID');
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
};

Cypress.Commands.add('kcLogin', (user) => {
  Cypress.log({ name: 'Login' });
  // Change isLocal to true to enable local
  if (Cypress.env('isLocal')) {
    localLogin(user);
  } else {
    pipelineLogin(user);
  }
});

Cypress.Commands.add('kcLogout', function () {
  Cypress.log({ name: 'Logout' });
  let realm = Cypress.env('KEYCLOAK_LOCAL_REALM');
  return cy.request({
    url: `${authBaseUrl}/realms/${realm}/protocol/openid-connect/logout`,
  });
});

Cypress.Commands.add('callAPI', ({ user, api, method = 'POST', body, followRedirect = false }) => {
  Cypress.log({ name: 'call-api' });
  cy.fixture('users/' + user).then((userData) => {
    let realm = Cypress.env('KEYCLOAK_LOCAL_REALM');
    let client_id = Cypress.env('KEYCLOAK_LOCAL_API_CLIENTID');
    let client_secret = Cypress.env('KEYCLOAK_LOCAL_SECRET');

    const base64URLEncode = (str) => {
      return str.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    };

    const code_challenge = base64URLEncode(crypto.randomBytes(32));

    cy.request({
      url: authBaseUrl + '/realms/' + realm + '/protocol/openid-connect/auth',
      followRedirect,
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
          followRedirect,
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
          followRedirect,
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
  });
});

// assigns the site_ids to the username, assuming the region is already correct
// does not un-assign previous sites
Cypress.Commands.add('assignSitesToUser', (username, site_ids) => {
  Cypress.log({ name: `assign site ${site_ids.join(',')} to ${username}` });
  cy.kcLogin('test-moh');

  cy.visit('/user-edit');

  // get tr containing our user
  cy.contains('td', username)
    .parent()
    .within(() => {
      // options button within parent tr
      cy.get('td:last-child button').click();
    });

  // click the input to bring up the ul
  cy.get('#mui-component-select-sites').click();

  site_ids.forEach((id) => {
    cy.get(`li[data-value='${id}']`).then(($li) => {
      const isAssigned = $li.attr('aria-selected');
      if (!isAssigned) {
        $li.click();
      }
    });
  });

  // blur the select component
  cy.get('#menu-sites').click();

  cy.contains('button', 'Submit').click();

  cy.kcLogout();
});

// Allows dev to use test data from csv files in the cypress test suites
Cypress.Commands.add('getCSVData', (dataSet) => {
  cy.readFile(CSVPaths[dataSet]).then((csvData) => {
    const rows = csvData.split('\n');
    const headers = rows[0].split(',');
    const rowArr = [];

    rows.slice(1).forEach((row) => {
      const values = row.split(',');
      const obj = {};

      headers.forEach((header, index) => {
        obj[header] = values[index];
      });

      rowArr.push(obj);
    });

    return rowArr;
  });
});
// Allows dev to add or subtract weeks from a mock date to use in their test, vs creating hard coded dates.
Cypress.Commands.add('formatDateWithOffset', (date, numOfWeeks, isAdd = true) => {
  const offSet = isAdd ? 6.048e8 * numOfWeeks : -6.048e8 * numOfWeeks;
  return new Date(new Date(date).getTime() + offSet).toISOString().split('T')[0];
});
