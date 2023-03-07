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

    cy.contains('button', 'Cancel').should('exist');
    cy.contains('button', 'Set')
      .should('exist')
      .then(($Set) => {
        $Set.click();
      });

    cy.wait(2000);
  };

  const navigateToFormSelectAll = () => {
    cy.visit('site-view');
    cy.get('th').find('[type="checkbox"]').check();
    cy.contains('button', 'Set Allocation').click();
  };

  it('MoH can set bulk allocations', () => {
    let siteCount = 0;

    cy.visit('site-view');
    cy.get('.MuiTable-root')
      .find('tr')
      .then((row) => {
        siteCount = row.length;
      });
    navigateToFormSelectAll();
    setBulkAllocationForm(90);

    // expect: no errors, success message.
    cy.contains('.Mui-error').should('not.exist');
    cy.get('.MuiAlert-message').contains(`${siteCount} sites have been assigned allocations`);
  });

  it('Validates required fields', () => {
    navigateToFormSelectAll();

    // attempt to
    cy.contains('button', 'Set').then(($Set) => {
      $Set.click();
    });

    // expect: required error on every field
    cy.contains('p.Mui-error', 'Allocation is required');
    cy.contains('p.Mui-error', 'Phase is required');
  });

  it('Allocation must be a positive number', () => {
    // attempt to submit form with a negative allocation
    navigateToFormSelectAll();
    // the MUI number component does not allow users to type a negative, so cypress needs to mock a keydown action
    cy.get('[name=allocation]').type('1{downArrow}{downArrow}{downArrow}');
    // cy.wait(500);
    // cy.contains('button', 'Set').then(($Set) => {
    //   $Set.click();
    // });

    cy.contains('button', 'Set').click({ force: true });

    cy.contains('p.Mui-error', 'Must be a positive number');
  });

  it('MOH overrides sites with existing allocations', () => {
    let siteCount = 0;

    cy.visit('site-view');
    cy.get('.MuiTable-root')
      .find('tr')
      .then((row) => {
        siteCount = row.length;
      });
    navigateToFormSelectAll();
    setBulkAllocationForm(200);
    cy.get('[name=acknowledgement]').should('exist');
    cy.get('[name=acknowledgement]').check();

    // expect: no errors, success message.
    cy.contains('.Mui-error').should('not.exist');
    cy.get('.MuiAlert-message').contains(`${siteCount} sites have been assigned allocations`);
  });
});
