describe('Phase functionality', () => {
  before(() => {});
  beforeEach(() => {
    cy.kcLogin('test-moh');
  });

  afterEach(() => {
    cy.kcLogout();
  });

  const completePhaseForm = ({ phaseName, startDate, endDate }) => {
    cy.get('[name=phaseName]').clear().type(phaseName);
    cy.get('[name=Startdate]').clear().type(`{ctrl+v}${startDate}}`);
    cy.get('[name=Enddate]').clear().type(`{ctrl+v}${endDate}`);

    cy.contains('button', 'Create').click();
  };

  const navigateToForm = () => {
    cy.visit('site-view');
    cy.contains('button', 'Action').click();
    cy.contains('li', 'Create new phase').click();
  };

  const navigateToEditForm = () => {
    cy.visit('site-view');
    cy.contains('button', 'Action').click();
    cy.contains('li', 'View phase list').click();
    cy.contains('tr', 'Test phase').contains('button', 'Edit').click();
  };

  it('MoH can create new phase', () => {
    // happy path
    navigateToForm();
    const formValues = {
      phaseName: 'Test phase',
      startDate: '1990/01/01',
      endDate: '1992/01/01',
    };
    completePhaseForm(formValues);
    // expect: no errors, success message.
    cy.contains('.Mui-error').should('not.exist');
    cy.get('.MuiAlert-message').contains(`Phase '${formValues.phaseName}' created successfully`);
  });

  it('New phase validates required fields', () => {
    // attempt to submit empty form
    navigateToForm();
    cy.contains('button', 'Create').click();

    // expect: required error on every field
    cy.get('#phaseNameError').contains('Phase name is required');
    cy.contains('p.Mui-error', 'Start Date is required');
    cy.contains('p.Mui-error', 'End Date is required');
  });

  it('New phase must be within reasonable range', () => {
    // attempt to submit empty form
    navigateToForm();
    const formValues = {
      phaseName: 'Test reasonable dates phase',
      startDate: '1899/12/31',
      endDate: '2100/01/01',
    };
    completePhaseForm(formValues);
    // expect: required error on every field
    cy.contains(
      'p.Mui-error',
      'Invalid entry. Date must be after December 31st 1899 and before January 1st 2100.'
    );
    cy.contains(
      'p.Mui-error',
      'Invalid entry. Date must be after December 31st 1899 and before January 1st 2100.'
    );
  });

  it('New phase endDate must be after startDate', () => {
    navigateToForm();
    const formValues = {
      phaseName: 'Test valid end date',
      startDate: '2023/01/05',
      endDate: '2023/01/04',
    };
    completePhaseForm(formValues);

    cy.contains('p.Mui-error', 'Invalid entry. End date must be at least 1 day after Start date');
  });

  it('New phase cannot overlap with existing phases', () => {
    navigateToForm();
    const formValues = {
      phaseName: 'Test overlaps',
      startDate: '1991/01/01',
      endDate: '1992/01/01',
    };
    completePhaseForm(formValues);

    cy.contains('p.Mui-error', 'Conflict with 1 or more phases');
  });

  it('MoH can edit the start date and end date of a phase', () => {
    navigateToEditForm();

    cy.get('[name=Startdate]').clear().type(`{ctrl+v}1990/06/06`);
    cy.get('[name=Enddate]').clear().type(`{ctrl+v}1991/01/01`);

    cy.contains('button', 'Update').click();

    // expect: no errors, success message.
    cy.contains('.Mui-error').should('not.exist');
    cy.get('.MuiAlert-message').contains(`Phase 'Test phase' updated successfully`);
  });

  it('MoH can not edit the phase name', () => {
    navigateToEditForm();
    // expect phaseName to be disabled
    cy.get('[name=phaseName]').should('have.class', 'Mui-disabled');
  });
});
