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
    cy.get('[name=Startdate]').clear().type(startDate);
    cy.get('[name=Enddate]').clear().type(endDate);

    cy.contains('button', 'Create').click();
  };

  const navigateToForm = () => {
    cy.visit('site-view');

    cy.contains('button', 'Action').click();
    cy.contains('li', 'Create new phase').click();
  };

  it('MoH can create new phase', () => {
    // happy path
    navigateToForm();
    const formValues = { phaseName: 'Test phase', startDate: '2022/01/01', endDate: '2022/12/31' };
    completePhaseForm(formValues);

    // expect: no errors, success message.
    cy.contains('.Mui-error').should('not.exist');
    cy.get('.MuiAlert-message').contains(`Phase '${formValues.phaseName}' added successfully`);
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
});
