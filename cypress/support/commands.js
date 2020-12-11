// These commands were sourced from the cypress-keycloak-login package
const utils_1 = require('./utils');

Cypress.Commands.add("kcGetToken", function (user) {
  Cypress.log({ name: "Login" });
  cy.fixture("users/" + user).then(function (userData) {
    (userData.password)? null : userData.password = Cypress.env("kc_sa_pass")
    let authBaseUrl = Cypress.env("auth_base_url");
    let realm = Cypress.env("auth_realm");
    let client_id = Cypress.env("auth_client_id");
    cy.request({
      method: "POST",
      url: authBaseUrl + "/realms/" + realm + "/protocol/openid-connect/token",
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      followRedirect: false,
      body: {
        grant_type: 'password',
        client_id: client_id,
        client_secret: Cypress.env("kc_api_secret"),
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
    let authBaseUrl = Cypress.env("auth_base_url");
    let realm = Cypress.env("auth_realm");
    return cy.request({
        url: authBaseUrl + "/realms/" + realm + "/protocol/openid-connect/logout"
    });
});

Cypress.Commands.add("kcNavAs", function (user, visitUrl) {
  if (visitUrl === void 0) { visitUrl = ""; }
  Cypress.log({ name: "Fake Login" });
  let authBaseUrl = Cypress.env("auth_base_url");
  let realm = Cypress.env("auth_realm");
  const { access_token, refresh_token, id_token } = Cypress.env();
  let state = utils_1.createUUID();
  let nonce = utils_1.decodeToken(access_token).nonce;
  let token = {
    access_token: access_token,
    expires_in: 300,
    refresh_expires_in: 1800,
    refresh_token: refresh_token,
    token_type: "bearer",
    id_token: id_token,
    "not-before-policy": 0,
    session_state: utils_1.createUUID(),
    scope: "openid"
  };

  let localStorageObj = {
    state: state,
    nonce: nonce,
    expires: Date() + 3600
  };
  let localStorageKey = "kc-callback-" + state;

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
  cy.intercept("post", authBaseUrl + "/realms/" + realm + "/protocol/openid-connect/token", token);
  cy.intercept("get", authBaseUrl + "/realms/" + realm + "/protocol/openid-connect/auth", userInfo(user));

  // in case visitUrl is an url with a hash, a second hash should not be added to the url
  let joiningCharacter = visitUrl.indexOf("#") === -1 ? "#" : "&";
  let url = Cypress.config().baseUrl + "/" + visitUrl + joiningCharacter + "state=" + state 
    + "&session_state=" + utils_1.createUUID() + "&code=" + utils_1.createUUID();
  cy.visit(url);
});
