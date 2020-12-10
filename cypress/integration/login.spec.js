describe("Login", () => {
  beforeEach(() => {
    cy.kcLogout()
  })

  it("logs in via Keycloak API", () => {
    cy.kcGetToken("service-account")
      .then(token => {
        cy.request({
          url: Cypress.env("auth_base_url"),
          followRedirect: true,
          auth: {
            bearer: token
          }
        });
      }).then(res => {
        cy.log(res)
        cy.visit('/');
      });
  });


  //// Arcane manual login feature
  //it("logs in via BCeID portal", () => {
  //  cy.visit('/');
  //  cy.contains('Login').click();
  //  cy.fixture('users/cypress-participant.json').then(participant => {
  //    cy.contains('BCeID')
  //      .invoke('attr', 'href')
  //      .then(href => {
  //        cy.url().then(portal =>{
  //          cy.task('getToken', {
  //            username: participant.username,
  //            password: participant.password,
  //            url: portal
  //          })
  //            .then(creds => {
  //              window.localStorage.setItem("TOKEN", creds["TOKEN"]);
  //              expect(localStorage.getItem("TOKEN")).to.not.be.null
  //            });
  //        });
  //      });
  //  });
  //  cy.visit('localhost:4000/admin');
  //});
})
