describe('Tests the PSI View', () => {
  beforeEach(() => {
    cy.kcLogout();
  });

  it('Visits the PSI View page as a Health Authority', () => {
    cy.kcLogin('test-ha');
    cy.visit('/psi-view');
    cy.contains("You don't have permission to view this content.");
  });

  it('Visits the PSI View Landing Page', () => {
    cy.kcLogin('test-moh');
    cy.visit('/admin');
    cy.contains('Manage PSI').click();
    cy.contains('th', 'Institute').click();
    cy.contains('th', 'Health Authority').click();
    cy.contains('th', 'Available Seats').click();
    cy.contains('th', 'Cohorts').click();
    cy.contains('th', 'Postal Code').click();
  });

  it('Adds a PSI, checks for correct data', () => {
    cy.kcLogin('test-moh');
    cy.visit('/psi-view');
    cy.contains('Add PSI').click();

    // Submit without entering data, check for errors
    cy.get('span.MuiButton-label').contains('Submit').click();
    cy.get('p#instituteNameError').should('be.visible');
    cy.get('p#postalCodeError').should('be.visible');
    cy.get('p#cityError').should('be.visible');
    cy.get('p#streetAddressError').should('be.visible');
    cy.get('p.Mui-error').contains('Health authority is required').should('be.visible');

    // Input incorrectly formatted postal code, check for formatting request
    cy.get('input#instituteName').type('Da Institoot');
    cy.get('input#postalCode').type('hey whats up hello');
    cy.get('span.MuiButton-label').contains('Submit').click();
    cy.get('p#postalCodeError').contains('Format').should('be.visible');

    cy.get('input#postalCode').clear().type('V6V 7V9');
    cy.get('input#streetAddress').type('1815 Blanshard St.');
    cy.get('input#city').type('Victoria');
    cy.get('div#mui-component-select-healthAuthority').click();
    cy.get('li').contains('Coastal').click();
    cy.get('span.MuiButton-label').contains('Submit').click();
    cy.contains('Da Institoot')
      .should('exist')
      .parent('tr')
      .within(() => {
        cy.contains('Vancouver Coastal').should('exist');
        cy.contains('0').should('exist');
        cy.contains('V6V 7V9').should('exist');
        cy.get('button').click(); // This will bring up the add cohort menu, eventually
      });
  });

  // Given that the previous entry was added to Vancouver Coastal, we should
  // see it show up under that filter and not under others.
  it('Checks to see that Health Authority filtering works', () => {
    cy.kcLogin('test-moh');
    cy.visit('/psi-view');
    cy.get('div[aria-label="Health Authority filter"]').click();
    cy.get('li').contains('Fraser').click();
    cy.contains('Da Institoot').should('not.exist');
    cy.get('div[aria-label="Health Authority filter"]').click();
    cy.get('li').contains('Coastal').click();
    cy.contains('Da Institoot').should('exist');
  });
});
