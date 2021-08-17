describe('Tests the Site Details View', () => {
  beforeEach(() => {
    cy.kcLogout();
  });

  it('creates a new site as MoH, asserts that it has default functionality', () => {
    cy.kcLogin('test-moh');
    cy.visit('/site-view');
    cy.get('span.MuiButton-label', { timeout: 10000 }).should('include.text', 'Create Site');
    cy.get('span.MuiButton-label').contains('Create Site').click();
    cy.get('input#siteId').focus().type('1111');
    cy.get('input#siteName').focus().type('New Site');
    cy.get('input#postalCode').focus().type('V1V1V1');
    cy.get('label.MuiFormControlLabel-root').contains('No').click();
    cy.get('div#mui-component-select-healthAuthority').click();
    cy.get('li').contains('Fraser Health').click();
    cy.get('span.MuiButton-label').contains('Submit').click();
    cy.contains('1111')
      .parent('tr')
      .within(() => {
        cy.get('button').click();
      });
    cy.get('button.Mui-selected').should('have.text', 'Site Details');
  });

  it('edits a site and confirms the new data is rendered', () => {
    cy.kcLogin('test-moh');
    cy.visit('/site-view');
    cy.contains('V1V1V1');
    cy.get('button').contains('details').click();
    cy.get('button').contains('Edit').click();
    cy.get('input#siteContactFirstName').clear().type('newName');
    cy.get('button').contains('Submit').click();
    cy.contains('newName').should('exist');
  });

  it('visits the Site Details View as health authority', () => {
    cy.kcLogin('test-ha');
    cy.visit('/site-view');
    cy.get('span.MuiButton-label', { timeout: 10000 }).should('include.text', 'details');
    cy.get('span.MuiButton-label').contains('details').click();
    cy.get('button.Mui-selected').should('have.text', 'Site Details');
  });
});
