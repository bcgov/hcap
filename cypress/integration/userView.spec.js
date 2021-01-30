describe("Tests the User View", () => {
  beforeEach(() => {
    cy.visit('/');
  })

  it("tests failed access request approval", () => {

    // kcNavAs is the command that bypasses keycloak login. First parameter
    // indicates the roles to be implemented upon navigating to the url in the
    // second parameter
    cy.kcNavAs("MoH", "user-pending");
    cy.contains('Options').click();

    // Cypress locates objects in the DOM via CSS selector syntax. Afterwards,
    // the component can be tested or interacted with.
    cy.get('div#mui-component-select-role').click();
    cy.get('li').contains("Ministry").click();

    // Should statements form the basis for cypress tests, check the
    // documentation for details on how to use them
    cy.get('input[name=acknowledgement]').should('have.attr', 'value', 'false');
    cy.get('button').contains('Submit').click();
    cy.get('p.Mui-error').should('be.visible');
  });

  it("tests successful access request approval", () => {
    cy.kcNavAs("MoH", "user-pending");
    cy.contains('Options').click();
    cy.get('div#mui-component-select-role').click();
    cy.get('li').contains("Ministry").click();
    cy.get('input[name=acknowledgement]').focus();
    cy.get('input[name=acknowledgement]').check();
    cy.get('input[name=acknowledgement]').should('have.attr', 'value', 'true');
    cy.get('button').contains('Submit').click();
    cy.get('div.MuiAlert-message').contains('Access request approved').should('be.visible');
  });
});
