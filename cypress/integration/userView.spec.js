describe("Tests the User View", () => {
  beforeEach(() => {
    cy.visit('/');
  })

  it("tests failed access request approval", () => {
    cy.kcNavAs("MoH", "user-view");
    cy.contains('Options').click();
    cy.get('div#mui-component-select-role').click();
    cy.get('li').contains("Ministry").click();
    cy.get('input[name=acknowledgement]').should('have.attr', 'value', 'false');
    cy.get('button').contains('Submit').click();
    cy.get('p.Mui-error').should('be.visible');
  });

  it("tests successful access request approval", () => {
    cy.kcNavAs("MoH", "user-view");
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
