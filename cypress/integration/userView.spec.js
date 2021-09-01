describe('Tests the User View', () => {
  beforeEach(() => {
    cy.kcLogout();
  });

  it('tests failed access request approval', () => {
    cy.kcLogin('test-moh');
    cy.visit('/user-pending');
    cy.contains('Options').click({ force: true });

    // Cypress locates objects in the DOM via CSS selector syntax. Afterwards,
    // the component can be tested or interacted with.
    cy.get('div#mui-component-select-role').click();
    cy.get('li').contains('Ministry').click();

    // Should statements form the basis for cypress tests, check the
    // documentation for details on how to use them
    cy.get('input[name=acknowledgement]').should('have.attr', 'value', 'false');
    cy.get('button').contains('Submit').click();
    cy.get('p.Mui-error').should('be.visible');
  });

  it('tests successful access request approval', () => {
    cy.kcLogin('test-moh');
    cy.visit('/user-pending');
    cy.contains('Options').click({ force: true });
    cy.get('div#mui-component-select-role').click();
    cy.get('li').contains('Ministry').click();
    cy.get('input[name=acknowledgement]').focus();
    cy.get('input[name=acknowledgement]').check();
    cy.get('input[name=acknowledgement]').should('have.attr', 'value', 'true');
    cy.get('button').contains('Submit').click();
    cy.wait(2000);
    cy.get('div.MuiAlert-message').contains('Access request approved').should('be.visible');
  });
});
