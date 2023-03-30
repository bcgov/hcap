describe('Tests the PSI View', () => {
  // Seed the db with two PSIs
  before(() => {
    cy.kcLogin('test-moh');
    cy.visit('/psi-view');
    cy.get('[test-id=add-psi-button]').click();
    cy.get('input#streetAddress').type('314 Pi Ct.');
    cy.get('input#instituteName').type('Testitute');
    cy.get('input#city').type('Port Renfrew');
    cy.get('input#postalCode').clear().type('V2V 3V4');
    cy.get('div#mui-component-select-healthAuthority').click();
    cy.get('li').contains('Island').click();
    cy.get('span.MuiButton-label').contains('Submit').click();

    cy.get('[test-id=add-psi-button]').click();
    cy.get('input#streetAddress').type('144 Numeral Ave.');
    cy.get('input#instituteName').type('Pythagorean Academy');
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
    cy.get('[test-id=psi-details-view-addr]').should('have.text', '314 Pi Ct.');
    cy.get('[test-id=psi-details-view-city]').should('have.text', 'Port Renfrew');
    cy.get('[test-id=psi-details-view-postal]').should('have.text', 'V2V 3V4');
    cy.contains('No Cohorts Added').should('exist');
  });

  it('Should Update PSI Details', () => {
    cy.kcLogin('test-moh');
    cy.visit('/admin');
    cy.contains('Manage PSI').click();
    cy.contains('Pythagorean Academy').click();
    cy.get('button').contains('Manage').click();
    cy.get('li').contains('Edit').should('be.visible').click();
    cy.get('input#streetAddress').clear().type('146 Numeral Ave');
    cy.intercept(`${Cypress.env('apiBaseURL')}/psi/*`).as('psiPatch');
    cy.get('span.MuiButton-label').contains('Submit').click();
    cy.wait('@psiPatch');
    cy.get('[test-id=psi-details-view-addr]').should('have.text', '146 Numeral Ave');
  });

  it('Visits a PSI details page, adds a cohort', () => {
    cy.kcLogin('test-moh');
    cy.visit('/admin');
    cy.contains('Manage PSI').click();
    cy.contains('Pythagorean Academy').click();
    cy.get('button').contains('Manage').click();
    cy.get('li').contains('Add Cohort').should('be.visible').click();
    cy.get('input#cohortName').type('Angular Observations');

    // Tests out of range date
    cy.get('input[name="StartDate"]').type('17200901');
    cy.get('button').contains('Submit').click();
    cy.contains('Invalid year').should('exist');

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
    cy.contains('01 Sep 2020').should('exist'); // Start Date displays properly
    cy.contains('01 Sep 2021').should('exist'); // End Date displays properly
    cy.get('[test-id=psi-details-view-total-cohort]')
      .invoke('text')
      .then((txt) => {
        expect(+txt).greaterThan(0);
      });
    cy.get('[test-id=psi-details-view-open-cohort]')
      .invoke('text')
      .then((txt) => {
        expect(+txt).equal(0);
      });

    cy.get('[test-id=psi-details-view-closed-cohort]')
      .invoke('text')
      .then((txt) => {
        expect(+txt).greaterThan(0);
      });

    // Adds a past cohort, checks to make sure it's marked as closed
    cy.get('button').contains('Manage').click();
    cy.get('li').contains('Add Cohort').should('be.visible').click();
    cy.get('input#cohortName').type('Obtuse Ontologies');
    cy.get('input[name="StartDate"]').type('19200901');
    cy.get('input[name="EndDate"]').type('19210901');
    cy.get('input#cohortSize').type('144');
    cy.get('button').contains('Submit').click();
    cy.get('[test-id=psi-details-view-total-cohort]')
      .invoke('text')
      .then((txt) => {
        expect(+txt).greaterThan(0);
      });
    cy.get('[test-id=psi-details-view-open-cohort]')
      .invoke('text')
      .then((txt) => {
        expect(+txt).gte(0);
      });
    cy.get('[test-id=psi-details-view-closed-cohort]')
      .invoke('text')
      .then((txt) => {
        expect(+txt).gte(0);
      });
    cy.get('button').contains('Edit').click();
    cy.contains(/Edit Cohort */gi).should('be.visible');
    cy.get('button').contains('Save Changes').click();
  });
});
