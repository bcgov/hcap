describe('Tests the Site Details View', () => {
  beforeEach(() => {
    cy.kcLogout();
  });

  it('visits the Site Details View as health authority', () => {
    cy.kcLogin('test-ha');
    cy.visit('/site-view');

    // We're ready once the loading bars appear and then disappear
    // cy.get('span.MuiSkeleton-root').should('exist');
    // cy.get('span.MuiSkeleton-root').should('not.exist');

    cy.get('span.MuiButton-label').should('include.text', 'details');
    cy.get('span.MuiButton-label').contains('details').click();
    cy.get('button.Mui-selected').should('have.text', 'Site Details');
  });

  it('creates a new site as MoH, asserts that it has default functionality', () => {
    cy.kcLogin('test-moh');
    cy.visit('/site-view');

    // Complete loading
    // cy.get('span.MuiSkeleton-root').should('exist');
    // cy.get('span.MuiSkeleton-root').should('not.exist');

    cy.get('span.MuiButton-label').should('include.text', 'Create Site');
    cy.get('span.MuiButton-label').contains('Create Site').click();
    cy.get('input#siteId').focus().type('1111');
    cy.get('input#siteName').focus().type('New Site');
    cy.get('input#postalCode').focus().type('V1V1V1');
    cy.get('label.MuiFormControlLabel-root').contains('No').click();
    cy.get('div#mui-component-select-healthAuthority').click();
    cy.get('li').contains('Fraser Health').click();
    // This should be Submit, not Cancel
    cy.get('span.MuiButton-label').contains('Submit').click();
    cy.contains('1111')
      .parent('tr')
      .within(() => {
        cy.get('button').click();
      });
    cy.get('button.Mui-selected').should('have.text', 'Site Details');
  });
});
