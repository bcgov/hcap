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
      });
  });

  it("tests the /admin page as a superuser", () => {
    cy.visit('/');
    cy.kcNavAs("superuser", "admin");
    cy.contains('Upload Participants').should('exist');
    cy.contains('View Participants').should('exist');
    cy.contains('View Employers').should('exist');
    cy.contains('View Access Requests').should('exist');
  });

  it("tests the /admin page as an employer", () => {
    cy.visit('/');
    cy.kcNavAs("employer", "admin");
    cy.contains('Upload Participants').should('not.exist');
    cy.contains('View Participants').should('exist');
    cy.contains('View Employers').should('not.exist');
    cy.contains('View Access Requests').should('not.exist');
  });
})
