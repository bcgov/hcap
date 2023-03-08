describe('Bulk Allocation functionality', () => {
  before(() => {});
  beforeEach(() => {
    cy.kcLogin('test-moh');
  });

  afterEach(() => {
    cy.kcLogout();
  });

  const setBulkAllocationForm = (allocation) => {
    cy.get('[name=phase_id]').parent().click();
    cy.get('li').eq(1).click();
    cy.get('[name=allocation]').clear().type(allocation);

    cy.contains('button', 'Set').click({ force: true });
    cy.get('form').submit();
  };

  const navigateToFormSelectAll = () => {
    cy.get('th').find('[type="checkbox"]').check();
    cy.contains('button', 'Set Allocation').click();
  };

  it('MoH can set bulk allocations', () => {
    cy.visit('site-view');
    cy.get('tbody tr')
      .its('length')
      .then((n) => {
        cy.log(n);
        navigateToFormSelectAll();
        setBulkAllocationForm(90);
        // expect: no errors, success message.
        cy.contains('.Mui-error').should('not.exist');
        // remove table header row from count
        cy.get('.MuiAlert-message').contains(`${n - 1} sites have been assigned allocations`);
      });
  });

  it('Validates required fields', () => {
    cy.visit('site-view');
    navigateToFormSelectAll();

    // attempt to
    cy.contains('button', 'Set').click({ force: true });
    cy.get('form').submit();

    // expect: required error on every field
    cy.contains('p.Mui-error', 'Allocation is required');
    cy.contains('p.Mui-error', 'Phase is required');
  });

  it('Allocation must be a positive number', () => {
    // attempt to submit form with a negative allocation
    cy.visit('site-view');
    navigateToFormSelectAll();
    // the MUI number component does not allow users to type a negative, so cypress needs to mock a keydown action
    cy.get('[name=allocation]').type('1{downArrow}{downArrow}{downArrow}');
    cy.contains('button', 'Set').click({ force: true });
    cy.get('form').submit();

    cy.contains('p.Mui-error', 'Must be a positive number');
  });

  it('MOH overrides sites with existing allocations', () => {
    cy.visit('site-view');
    cy.get('tbody tr')
      .its('length')
      .then((n) => {
        cy.log(n);
        navigateToFormSelectAll();
        setBulkAllocationForm(200);
        cy.get('[name=acknowledgement]').should('exist');
        cy.get('[name=acknowledgement]').check();
        cy.get('form').submit();

        // expect: no errors, success message.
        cy.contains('.Mui-error').should('not.exist');
        // remove table header row from count
        cy.get('.MuiAlert-message').contains(`${n - 1} sites have been assigned allocations`);
      });
  });
});
