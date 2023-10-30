describe('Allocation functionality', () => {
  before(() => {});
  beforeEach(() => {
    cy.kcLogin('test-moh');
  });

  // create new phase to assign
  const createPhase = ({ phaseName, startDate, endDate }) => {
    cy.visit('site-view');
    cy.contains('button', 'Action').click();
    cy.contains('li', 'Create new phase').click();

    cy.get('[name=phaseName]').clear().type(phaseName);
    // the MUI date component does not allow users to type, so cypress needs to mock a copy/paste keyboard action
    cy.get('[name=Startdate]').clear().type(`{ctrl+v}${startDate}`);
    cy.get('[name=Enddate]').clear().type(`{ctrl+v}${endDate}`);

    cy.contains('button', 'Create').click();
  };

  const setAllocationForm = ({ allocation, mhawAllocation }) => {
    cy.get('[name=allocation]').clear().type(allocation);
    cy.get('[name=mhawAllocation]').clear().type(allocation);
    cy.contains('button', 'Set').click();
  };

  const navigateToForm = (buttonLabel) => {
    cy.visit('site-view/1');
    cy.get('.MuiTab-wrapper').contains('Allocation').click();
    cy.get('tr', { timeout: 10000 }).first();
    cy.get('button').contains(buttonLabel).click();
  };

  it('MoH can set a new allocation', () => {
    // create new phase to assign allocation to
    const phaseData = {
      phaseName: 'Allocation Testing Phase',
      startDate: '1996/01/01',
      endDate: '1997/01/01',
    };
    createPhase(phaseData);
    // happy path
    navigateToForm('set');
    const formValues = {
      allocation: '90',
      mhawAllocation: '80',
    };
    setAllocationForm(formValues);

    // expect: no errors, success message.
    cy.contains('.Mui-error').should('not.exist');
    cy.get('.MuiAlert-message').contains(`New phase allocation has been successfully assigned`);
  });

  it('Validates required fields', () => {
    // create new phase to assign allocation to
    //  this phase can be used for the following tests
    const phaseData = {
      phaseName: 'Allocation Testing Phase Two',
      startDate: '1993/01/01',
      endDate: '1994/01/01',
    };
    createPhase(phaseData);
    // attempt to submit empty form
    navigateToForm('set');
    cy.contains('button', 'Set').click();

    // expect: required error on every field
    cy.contains('p.Mui-error', 'Allocation is required');
  });

  it('Expect start and end date to be disabled', () => {
    navigateToForm('set');

    // expect: dates to be disabled
    cy.get('[name=Startdate]').should('have.class', 'Mui-disabled');
    cy.get('[name=Enddate]').should('have.class', 'Mui-disabled');
  });

  it('Allocation must be a positive number', () => {
    // attempt to submit form with a negative allocation
    navigateToForm('set');
    // the MUI number component does not allow users to type a negative, so cypress needs to mock a keydown action
    cy.get('[name=allocation]').type('1{downArrow}{downArrow}{downArrow}');
    cy.contains('button', 'Set').click();

    cy.contains('p.Mui-error', 'Must be a positive number');
  });

  it('Allocation can be edited', () => {
    // happy path for editing allocations
    navigateToForm('edit');

    const formValues = {
      allocation: '30',
      mhawAllocation: '40',
    };
    setAllocationForm(formValues);

    // expect: no errors, success message.
    cy.contains('.Mui-error').should('not.exist');
    cy.get('.MuiAlert-message').contains(`Phase allocation has been successfully updated`);
  });
});
