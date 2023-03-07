describe('Bulk Allocation functionality', () => {
  before(() => {});
  beforeEach(() => {
    cy.kcLogin('test-moh');
  });

  afterEach(() => {
    cy.kcLogout();
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

  const setBulkAllocationForm = (allocation) => {
    cy.get('[name=phase_id]').parent().click();
    cy.get('li').eq(1).click();
    cy.get('[name=allocation]').clear().type(allocation);

    cy.contains('button', 'Set').should('exist');
    cy.debug();
    cy.contains('button', 'Set').click();
  };

  // const navigateToForm = (buttonLabel) => {
  //   cy.visit('site-view/1');
  //   cy.get('.MuiTab-wrapper').contains('Allocation').click();
  //   cy.get('tr').first();
  //   cy.get('button').contains(buttonLabel).click();
  // };

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
    cy.contains('button', 'Set').click();

    // expect: required error on every field
    cy.contains('p.Mui-error', 'Allocation is required');
    cy.contains('p.Mui-error', 'Phase is required');
  });

  // it('Allocation must be a positive number', () => {
  //   // attempt to submit form with a negative allocation
  //   cy.visit('site-view');
  //   cy.get('th').first();
  //   cy.get('[type="checkbox"]').check();
  //   cy.contains('button', 'Set Allocation').click();
  //   // the MUI number component does not allow users to type a negative, so cypress needs to mock a keydown action
  //   cy.get('[name=allocation]').type('1{downArrow}{downArrow}{downArrow}');
  //   cy.wait(500);
  //   cy.contains('button', 'Set').click();

  //   cy.contains('p.Mui-error', 'Must be a positive number');
  // });

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
