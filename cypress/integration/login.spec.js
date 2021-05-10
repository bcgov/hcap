describe('Login', () => {
  beforeEach(() => {
    cy.kcLogout();
  });

  it("logs in via Keycloak API", () => {
    cy.kcLogin("test-admin");
    cy.visit('/admin');
    cy.contains('Upload Participants').should('exist');
  });

  // it("tests the /admin page as a superuser", () => {
  //   cy.visit('/');
  //   cy.kcNavAs("superuser", "admin");
  //   cy.contains('Upload Participants').should('exist');
  //   cy.contains('View Participants').should('exist');
  //   cy.contains('View Employer EOIs').should('exist');
  //   cy.contains('View Access Requests').should('exist');
  // });

  // it("tests /admin redirection as an employer", () => {
  //   cy.visit('/');
  //   cy.kcNavAs("employer", "admin");
  //   cy.location().should((loc) => {
  //     expect(loc.pathname).to.eq('/participant-view');
  //   });
  // });
})
