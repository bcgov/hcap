// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

import "cypress-keycloak-commands"

// These commands were sourced from the cypress-keycloak-login package
var utils_1 = require('./utils');

Cypress.Commands.add("kcGetToken", function (user) {
  Cypress.log({ name: "Login" });
  cy.fixture("users/" + user).then(function (userData) {
    (userData.password)? null : userData.password = Cypress.env("kc_sa_pass")
    var authBaseUrl = Cypress.env("auth_base_url");
    var realm = Cypress.env("auth_realm");
    var client_id = Cypress.env("auth_client_id");
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
