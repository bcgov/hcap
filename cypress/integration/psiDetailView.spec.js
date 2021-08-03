describe('Tests the PSI View', () => {
  // Seed the db with at least one PSI
  before(() => {
    cy.kcLogin('test-moh');
    cy.visit('/psi-view');
    cy.contains('Add PSI').click();
    cy.get('input#instituteName').type('Testitute');
    cy.get('input#streetAddress').type('314 Pi Ct.');
    cy.get('input#city').type('Port Renfrew');
    cy.get('input#postalCode').clear().type('V2V 3V4');
    cy.get('div#mui-component-select-healthAuthority').click();
    cy.get('li').contains('Island').click();
    cy.get('span.MuiButton-label').contains('Submit').click();

    cy.contains('Add PSI').click();
    cy.get('input#instituteName').type('Pythagorean Academy');
    cy.get('input#streetAddress').type('144 Numeral Ave.');
    cy.get('input#city').type('Sooke');
    cy.get('input#postalCode').clear().type('V3V 5V4');
    cy.get('div#mui-component-select-healthAuthority').click();
    cy.get('li').contains('Island').click();
    cy.get('span.MuiButton-label').contains('Submit').click();
  });

  beforeEach(() => {
    cy.kcLogout();
  });

  it('Visits a PSI details page with no cohorts', () => {
    cy.kcLogin('test-moh');
    cy.visit('/admin');
    cy.contains('Manage PSI').click();
    cy.contains('Testitute').click();
    cy.contains('PSI Info').should('exist');
    cy.get('p#streetAddress').should('have.text', '314 Pi Ct.');
    cy.get('p#city').should('have.text', 'Port Renfrew');
    cy.get('p#postalCode').should('have.text', 'V2V 3V4');
    cy.contains('No Cohorts Added').should('exist');
  });

  it('Visits a PSI details page, adds a cohort', () => {
    cy.kcLogin('test-moh');
    cy.visit('/admin');
    cy.contains('Manage PSI').click();
    cy.contains('Pythagorean Academy').click();
    cy.get('button').contains('Manage PSI').click();
    cy.get('li').contains('Add Cohort').should('be.visible').click();
    cy.get('input#cohortName').type('Angular Observations');

    // Tests out of range date
    cy.get('input[name="StartDate"]').type('17200901');
    cy.get('button').contains('Submit').click();
    cy.get('Invalid year').should('exist');

    // Tests Start Date < End Date
    cy.get('input[name="StartDate"]').clear().type('20200901');
    cy.get('input[name="EndDate"]').type('20000901');
    cy.get('button').contains('Submit').click();
    cy.contains('End Date must be after Start Date').should('exist');

    // Tests Successful Cohort Addition
    cy.get('input[name="EndDate"]').clear().type('20210901');
    cy.get('input#cohortSize').type('144');
    cy.get('button').contains('Submit').click();
    cy.contains('No Cohorts Added').should('not.exist');
    cy.contains('Angular Observations').should('exist');
    cy.get('p#totalCohorts').should('have.text', 1);
    cy.get('p#openCohorts').should('have.text', 1);
    cy.get('p#closedCohorts').should('have.text', 0);
  });
});
