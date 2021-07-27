describe('Tests the PSI View', () => {
  // Seed the db with at least one PSI
  before(() => {
    cy.kcLogin('test-moh');
    cy.visit('/psi-view');
    cy.contains('Add PSI').click();
    cy.get('input#instituteName').type('Testitute (not destitute)');
    cy.get('input#streetAddress').type('314 Pi Ct.');
    cy.get('input#city').type('Port Renfrew');
    cy.get('input#postalCode').clear().type('V2V 3V4');
    cy.get('div#mui-component-select-healthAuthority').click();
    cy.get('li').contains('Island').click();
    cy.get('span.MuiButton-label').contains('Submit').click();
  });

  beforeEach(() => {
    cy.kcLogout();
  });

  it('Visits the PSI View Details Page', () => {
    cy.kcLogin('test-moh');
    cy.visit('/admin');
    cy.contains('Manage PSI').click();
    cy.contains('Testitute').click();
    cy.contains('PSI Info').should('exist');
  });
});
