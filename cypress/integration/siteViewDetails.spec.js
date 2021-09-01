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
        cy.get('button').click({ force: true });
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
    cy.get('input#siteContactLastName').clear().type('Name');
    cy.get('input#siteContactPhone').clear().type('1112223333');
    cy.get('input#siteContactEmail').clear().type('email@addr.ess');
    cy.get('input#siteName').clear().type('IGotAName');
    cy.get('input#registeredBusinessName').clear().type('JimCroce');
    cy.get('input#address').clear().type('123 Place');
    cy.get('input#city').clear().type('Victoria');
    cy.get('label.MuiFormControlLabel-root').contains('No').click();
    cy.get('input#postalCode').clear().type('V1V1V1');
    cy.get('input#allocation').clear().type('42');
    cy.get('input#operatorContactFirstName').clear().type('Sylvan');
    cy.get('input#operatorContactLastName').clear().type('Esso');
    cy.get('input#operatorPhone').clear().type('3332221111');
    cy.get('input#operatorEmail').clear().type('rooftop@danci.ng');
    cy.get('button').contains('Submit').click();
    cy.get('div.MuiDialog-container').should('not.exist');
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
