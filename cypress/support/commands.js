// These commands were sourced from the cypress-keycloak-login package
const utils_1 = require('./utils');
const { v4 } = require('uuid');

Cypress.Commands.add("kcGetToken", function (user) {
  Cypress.log({ name: "Login" });
  cy.fixture("users/" + user).then(function (userData) {
    (userData.password)? null : userData.password = Cypress.env("KEYCLOAK_SA_PASSWORD")
    let authBaseUrl = Cypress.env("KEYCLOAK_AUTH_URL");
    let realm = Cypress.env("KEYCLOAK_REALM");
    let client_id = Cypress.env("KEYCLOAK_FE_CLIENTID");
    cy.request({
      method: "POST",
      url: authBaseUrl + "/realms/" + realm + "/protocol/openid-connect/token",
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      followRedirect: false,
      body: {
        grant_type: 'password',
        client_id: client_id,
        client_secret: Cypress.env("KEYCLOAK_API_CLIENTID"),
        username: userData.username,
        password: userData.password,
      }
    })
      .then(function (response) {
        window.localStorage.setItem("TOKEN", response.body.access_token);
        return response.body.access_token;
      })
  });
});

Cypress.Commands.add("kcLogout", function () {
    Cypress.log({ name: "Logout" });
    let authBaseUrl = Cypress.env("KEYCLOAK_AUTH_URL");
    let realm = Cypress.env("KEYCLOAK_REALM");
    return cy.request({
        url: `${authBaseUrl}/realms/${realm}/protocol/openid-connect/logout`
    });
});

Cypress.Commands.add("kcNavAs", function (user, visitUrl) {
  visitUrl = visitUrl || ""
  Cypress.log({ name: "Fake Login" });
  let authBaseUrl = Cypress.env("KEYCLOAK_AUTH_URL");
  let realm = Cypress.env("KEYCLOAK_REALM");
  let access_token = Cypress.env("ACCESS_TOKEN");
  let refresh_token = Cypress.env("REFRESH_TOKEN");
  let id_token = Cypress.env("ID_TOKEN");
  let state = v4();
  let nonce = utils_1.decodeToken(access_token).nonce;
  let token = {
    access_token: access_token,
    expires_in: 300,
    refresh_expires_in: 1800,
    refresh_token: refresh_token,
    token_type: "bearer",
    id_token: id_token,
    "not-before-policy": 0,
    session_state: v4(),
    scope: "openid"
  };

  let localStorageObj = {
    state: state,
    nonce: nonce,
    expires: Date() + 3600
  };
  const localStorageKey = `kc-callback-${state}`

  // This function defines the values that will be returned from the call to
  // /protocol/openid-connect/auth
  const userInfo = (userType) => {
    if (userType === "superuser") return {
      name: "Test Superuser",
      roles: [ "superuser" ]
    }

    if (userType === "employer") return {
      name: "Test Employer",
      roles: [ "employer" ]
    }
  }

  window.localStorage.setItem(localStorageKey, JSON.stringify(localStorageObj));
  cy.intercept("post", `${authBaseUrl}/realms/${realm}/protocol/openid-connect/token`, token);
  cy.intercept("get", `${authBaseUrl}/realms/${realm}/protocol/openid-connect/auth`, userInfo(user));

  const url = new URL(`${Cypress.config().baseUrl}${visitUrl}#state=${state}&session_state=${v4()}&code=${v4()}`);
  cy.visit(url.toString());
});
