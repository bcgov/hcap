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

  const sites = [
    {
      "city":"Richmond",
      "siteId":4,
      "address":"123 Generic St",
      "siteName":"Bob's Home Care",
      "postalCode":"A1A 1A1",
      "operatorName":"FreshTeam",
      "operatorEmail":"bob.burger@test.com",
      "operatorPhone":"5555555555",
      "healthAuthority":"Fraser",
      "siteContactLastName":"Burger",
      "siteContactFirstName":"Bob",
      "earlyAdopterAllocation":3,
      "registeredBusinessName":"FRESHWORKS STUDIO INC.",
      "siteContactPhoneNumber":"5555555555",
      "operatorContactLastName":"Burger",
      "siteContactEmailAddress":"bob.burger@test.com",
      "operatorContactFirstName":"Bob",
      "id":3,
      "created_at":"2021-01-26T17:22:43.803Z",
      "updated_at":null
    },
    {
      "city":"Kamloops",
      "siteId":3,
      "address":"64 Test Rd",
      "siteName":"Sample Site",
      "postalCode":"B2B 2B2",
      "operatorName":"SAMPLE",
      "operatorEmail":"ashley.admin@test.com",
      "operatorPhone":"5555555555",
      "healthAuthority":"Interior",
      "siteContactLastName":"Admin",
      "siteContactFirstName":"Ashley",
      "registeredBusinessName":"SAMPLE BOUTIQUE",
      "siteContactPhoneNumber":"5555555555",
      "operatorContactLastName":"Admin",
      "siteContactEmailAddress":"ashley.admin@test.com",
      "operatorContactFirstName":"Ashley",
      "id":4,
      "created_at":"2021-01-26T17:22:43.803Z",
      "updated_at":null
    },
    {
      "city":"Burnaby",
      "siteId":1,
      "address":"123 Known St",
      "siteName":"Forgotten Homes",
      "postalCode":"Z1Z 1Z1",
      "operatorName":"Operator",
      "operatorEmail":"first.last@test.com",
      "operatorPhone":"5555555555",
      "healthAuthority":"Fraser",
      "siteContactLastName":"Last",
      "siteContactFirstName":"First",
      "registeredBusinessName":"FORGOTTEN ISLAND FARM",
      "siteContactPhoneNumber":"5555555555",
      "operatorContactLastName":"Last",
      "siteContactEmailAddress":"first.last@test.com",
      "operatorContactFirstName":"First",
      "id":5,
      "created_at":"2021-01-26T17:22:43.800Z",
      "updated_at":null
    },
    {
      "city":"Osoyoos",
      "siteId":6,
      "address":"2021 New Rd",
      "siteName":"#2 Spreadsheet Care",
      "postalCode":"A1A 1A2",
      "operatorName":"Interior Health Authority",
      "operatorEmail":"heather@ha.test.com",
      "operatorPhone":"5555555555",
      "healthAuthority":"Interior",
      "siteContactLastName":"Contact",
      "siteContactFirstName":"Cathy",
      "earlyAdopterAllocation":30,
      "registeredBusinessName":"Interior Health Authority",
      "siteContactPhoneNumber":"5555555555",
      "operatorContactLastName":"Haverston",
      "siteContactEmailAddress":"cathy@ha.test.com",
      "operatorContactFirstName":"Heather",
      "id":6,
      "created_at":"2021-01-26T17:22:43.822Z",
      "updated_at":null
    },
    {
      "city":"Prince Rupert",
      "siteId":2,
      "address":"90 Test Ave",
      "siteName":"Home Sweet Home",
      "postalCode":"A1A 2B2",
      "operatorName":"Home Sweet Home",
      "operatorEmail":"hannah123@test.com",
      "operatorPhone":"1234567890",
      "healthAuthority":"Northern",
      "siteContactLastName":"Homebody",
      "siteContactFirstName":"Hannah",
      "earlyAdopterAllocation":10,
      "registeredBusinessName":"HOME SWEET HOME, HOME SERVICES",
      "siteContactPhoneNumber":"1234567890",
      "operatorContactLastName":"Homebody",
      "siteContactEmailAddress":"hannah123@test.com",
      "operatorContactFirstName":"Hannah",
      "id":1,
      "created_at":"2021-01-26T17:22:43.800Z",
      "updated_at":null
    },
    {
      "city":"Osoyoos",
      "siteId":5,
      "address":"2020 New Rd",
      "siteName":"Spreadsheet Care",
      "postalCode":"A1A 1A1",
      "operatorName":"Interior Health Authority",
      "operatorEmail":"heather@ha.test.com",
      "operatorPhone":"5555555555",
      "healthAuthority":"Interior",
      "siteContactLastName":"Contact",
      "siteContactFirstName":"Cathy",
      "earlyAdopterAllocation":20,
      "registeredBusinessName":"Interior Health Authority",
      "siteContactPhoneNumber":"5555555555",
      "operatorContactLastName":"Haverston",
      "siteContactEmailAddress":"cathy@ha.test.com",
      "operatorContactFirstName":"Heather",
      "id":2,
      "created_at":"2021-01-26T17:22:43.804Z",
      "updated_at":null
    }
  ];

  // This function defines the values that will be returned from the call to
  // /protocol/openid-connect/auth
  //
  const userInfo = (userType) => {
    let jsonOutput = {
      name: "Test User",
      pagination: {
        offset: 0,
        total: 0,
      },
      roles: [],
      data: [
        {
          "id":"17b2254c-269e-4c21-b19d-0c005365a5e9",
          "emailAddress":"graeme.clarke@gov.bc.ca",
          "username":"gclarke@idir",
          "firstName":"Graeme",
          "lastName":"Clarke",
          "createdAt":"2020-11-12 18:33"
        },
      ],
    };

    if (userType.includes("superuser")) {
      jsonOutput.name = "Test Superuser";
      jsonOutput.roles.push("superuser",
        "region_vancouver_island",
        "region_fraser",
        "region_interior",
        "region_northern",
        "region_vancouver_coastal"
      );
    }

    if (userType.includes("ministry_of_health")) {
      jsonOutput.name = "Test MoH";
      jsonOutput.roles.push("ministry_of_health",
        "region_vancouver_island",
        "region_fraser",
        "region_interior",
        "region_northern",
        "region_vancouver_coastal"
      );
    }

    if (userType.includes("employer")) {
      jsonOutput.name = "Test Employer";
      jsonOutput.roles.push("employer");
    }

    if (userType.includes("MoH")) {
      jsonOutput.name = "Test MoH";
      jsonOutput.roles.push("ministry_of_health");
    }

    if (userType.includes("island")) {
      jsonOutput.roles.push("region_vancouver_island");
    }

    if (userType.includes("fraser")) {
      jsonOutput.roles.push("region_fraser");
    }

    return jsonOutput;
  }

  window.localStorage.setItem(localStorageKey, JSON.stringify(localStorageObj));
  cy.intercept("post", `${authBaseUrl}/realms/${realm}/protocol/openid-connect/token`, token);
  cy.intercept("get", `${authBaseUrl}/realms/${realm}/protocol/openid-connect/auth`, userInfo(user));
  cy.intercept('get', 'api/v1/employer-sites', {data: sites});
  cy.intercept('get', 'api/v1/user', { "sites": [6,4,2,5], roles: userInfo(user).roles });


  const url = new URL(`${Cypress.config().baseUrl}/${visitUrl}#state=${state}&session_state=${v4()}&code=${v4()}`);
  cy.visit(url.toString());
});
