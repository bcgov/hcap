describe('Tests the Cohort View', () => {
  beforeEach(() => {
    setAlias();
    cy.kcLogout();
  });

  const setAlias = () => {
    cy.getCSVData('psi').then((data) => {
      cy.wrap(data).as('psi');
    });
    cy.getCSVData('cohorts').then((data) => {
      cy.wrap(data).as('cohorts');
    });
  };

  const visitsCohort = (healthAuthority) => {
    cy.visit('/admin');
    cy.contains('Manage PSI').click();
    cy.get('div[aria-label="Health Authority filter"]').click();
    cy.get('li').contains(healthAuthority).click();

    // Click on a PSI in fraser, and click on a cohort
    cy.get('@psi').then((psi) => {
      const pisInHA = psi.filter((institute) => institute.health_authority === healthAuthority);
      cy.contains(pisInHA[0].institute_name).click();
      cy.get('@cohorts').then((cohorts) => {
        const cohortInPSI = cohorts.filter((cohort) => cohort.psi_id === pisInHA[0].id);
        // add alias for cohort to use in later in the test
        cy.wrap(cohortInPSI[2]).as('selectedCohort');
        cy.contains(cohortInPSI[2].cohort_name).click();
      });
    });
  };

  it('HA visits a PSI details page -> creates new cohort', () => {
    cy.kcLogin('test-ha');
    cy.visit('/admin');
    cy.contains('Manage PSI').click();

    cy.get('@psi').then((psi) => {
      // intentionally select a PSI with 0 existing cohorts
      cy.contains(psi[12].institute_name).click();
    });
    // expect there to be no cohorts
    cy.get('.MuiTypography-h5').contains('No Cohorts Added').should('be.visible');

    // Add a cohort
    cy.get('button').contains('Manage').click();
    cy.get('li').contains('Add Cohort').should('be.visible').click();

    // Submits successful form
    cy.get('input#cohortName').type('Empty New Cohort');
    cy.get('input[name="StartDate"]').clear().type('2023/01/01');
    cy.get('input[name="EndDate"]').clear().type('2024/01/01');
    cy.get('input#cohortSize').type('100');
    cy.get('button').contains('Submit').click();
    // expect success message
    cy.get('div.MuiAlert-message')
      .contains(`Cohort 'Empty New Cohort' added successfully`)
      .should('be.visible');
  });

  it('HA visits new cohort, checks for no participants in the table`', () => {
    cy.kcLogin('test-ha');
    cy.visit('/psi-view');

    cy.get('@psi').then((psi) => {
      // intentionally select a PSI with 0 existing cohorts
      cy.contains(psi[12].institute_name).click();
      cy.intercept(`${Cypress.env('apiBaseURL')}/cohorts/*`).as('cohortGet');
      cy.contains('Empty New Cohort').click();
      // Wait for page to load after click
      cy.wait('@cohortGet');
      // wait for page to load before checking for notification
      cy.get('.MuiTypography-body1').contains('100');
      cy.get('.MuiTypography-subtitle1')
        .contains('No Participants in this Cohort')
        .should('be.visible');
    });
  });

  it('MOH visits cohort view, cannot `Bulk Graduate`', () => {
    cy.kcLogin('test-moh');
    visitsCohort('Fraser');

    cy.get('button').contains('Bulk Graduate').should('not.exist');
  });

  it('MOH visits cohort view, can see all participants in every region', () => {
    cy.kcLogin('test-moh');
    visitsCohort('Fraser');

    cy.get('tbody tr').should('have.length', 8);
    // MOH can see all participants
    cy.get('.MuiAlert-standardInfo').should('not.exist');
  });

  it('HA visits cohort view, can only see participants in their region', () => {
    cy.kcLogin('test-ha');
    visitsCohort('Fraser');

    cy.get('tr td').find('[type="checkbox"]').should('have.length', 5);
    cy.get('.MuiAlert-standardInfo')
      .contains('Participants hired outside your region will not appear in this list')
      .should('be.visible');
  });

  it('HA visits cohort view, can  `Bulk Graduate`', () => {
    cy.kcLogin('test-ha');
    visitsCohort('Fraser');

    cy.get('button').contains('Bulk Graduate').should('be.visible');
    // select all rows in table
    cy.get('tr td')
      .find('[type="checkbox"]')
      .its('length')
      .then((n) => {
        cy.get('th').find('[type="checkbox"]').check();
        cy.contains('button', 'Bulk Graduate').click();
        cy.get('@selectedCohort').then((selectedCohort) => {
          // form is pre-populated with cohortEndDate
          cy.formatDateWithOffset(selectedCohort.end_date, 1, false).then((formattedDate) => {
            cy.get('[name=GraduationDate]').clear().type(`{ctrl+v}${formattedDate}`);
          });

          // attempt to submit form with a graduation date set before cohort endDate
          cy.contains('button', 'Submit').should('have.class', 'Mui-disabled');
          cy.get('.MuiAlert-standardWarning')
            .contains('Graduation cannot be tracked before cohort has ended.')
            .should('be.visible');

          // update the date to be valid and submit form
          cy.formatDateWithOffset(selectedCohort.end_date, 1).then((formattedDate) => {
            cy.get('[name=GraduationDate]').clear().type(`{ctrl+v}${formattedDate}`);
          });

          cy.intercept(`${Cypress.env('apiBaseURL')}/post-hire-status`).as('statusPost');
          cy.contains('button', 'Submit').click();
          // expect: no errors, success message.
          cy.contains('.Mui-error').should('not.exist');
          // wait for form to submit and message to show
          cy.wait('@statusPost');
          cy.get('.MuiAlert-message').contains('Participant(s) status updated');
        });
      });
  });

  it('HA visits cohort view, cannot click `Bulk Graduate` as participants already have a status set', () => {
    cy.kcLogin('test-ha');
    visitsCohort('Fraser');

    cy.get('button').contains('Bulk Graduate').should('be.visible');
    cy.get('th').find('[type="checkbox"]').check();
    // button should be disabled. as participants have already been graduated.
    cy.contains('Bulk Graduate').should('have.class', 'Mui-disabled');

    cy.get('.MuiAlert-standardWarning')
      .contains(
        'Bulk Graduation is only available for participants with no graduation status. Please deselect participants who have had a successful or unsuccessful graduation.'
      )
      .should('be.visible');
  });
});
