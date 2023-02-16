describe('Allocation functionality', () => {
  before(() => {});
  beforeEach(() => {
    cy.kcLogin('test-moh');
  });

  afterEach(() => {
    cy.kcLogout();
  });

  const selAllocationForm = ({ allocation }) => {
    cy.get('[name=allocation]').clear().type(allocation);

    cy.contains('button', 'Set').click();
  };

  const navigateToForm = () => {
    cy.visit('site-view/1');
    cy.get('.MuiTab-wrapper').contains('Allocation').click();
    cy.get('tr').first();
    cy.get('button').contains('set').click();
  };

  it('MoH can set a new allocation', () => {
    // happy path
    navigateToForm();
    const formValues = {
      allocation: '90',
    };
    selAllocationForm(formValues);

    // expect: no errors, success message.
    cy.contains('.Mui-error').should('not.exist');
    cy.get('.MuiAlert-message').contains(`New phase allocation has been successfully assigned`);
  });

  it('Validates required fields', () => {
    // attempt to submit empty form
    navigateToForm();
    cy.contains('button', 'Set').click();

    // expect: required error on every field
    cy.contains('p.Mui-error', 'Allocation is required');
  });

  it('Expect start and end date to be disabled', () => {
    navigateToForm();

    // expect: dates to be disabled
    cy.get('[name=Startdate]').should('have.class', 'Mui-disabled');
    cy.get('[name=Enddate]').should('have.class', 'Mui-disabled');
  });

  it('Validated max of 99', () => {
    navigateToForm();
    const formValues = {
      allocation: '120',
    };
    selAllocationForm(formValues);

    // expect: error message to appear
    cy.contains('p.Mui-error', 'Must be between 0-99');
  });

  it('Allocation must be a positive number', () => {
    // attempt to submit form with a negative allocation
    navigateToForm();

    cy.get('[name=allocation]').type('1{downArrow}{downArrow}{downArrow}');
    cy.wait(500);
    cy.contains('button', 'Set').click();

    cy.contains('p.Mui-error', 'Must be a positive number');
  });
});
