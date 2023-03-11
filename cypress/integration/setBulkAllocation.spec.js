describe('Bulk Allocation functionality', () => {
  before(() => {});

  beforeEach(() => {
    cy.kcLogin('test-moh');
  });

  afterEach(() => {
    cy.kcLogout();
  });

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

  const setBulkAllocationForm = (allocation, override = false) => {
    cy.get('[name=phase_id]').parent().click();
    cy.get('li').contains('Bulk Allocation Testing Phase').click();
    cy.get('[name=allocation]').clear().type(allocation);

    if (override) {
      cy.get('[name=acknowledgement]').check();
    }

    cy.contains('button', 'Set').click({ force: true });
    cy.get('form').submit();
  };

  const navigateToFormSelectAll = () => {
    cy.get('th').find('[type="checkbox"]').check();
    cy.contains('button', 'Set Allocation').click();
  };

  it('MoH can set bulk allocations', () => {
    const phaseData = {
      phaseName: 'Bulk Allocation Testing Phase',
      startDate: '2023/01/01',
      endDate: '2024/01/01',
    };
    // create phase - use new phase to set allocations
    createPhase(phaseData);
    cy.visit('site-view');
    navigateToFormSelectAll();
    cy.get('tr td')
      .find('[type="checkbox"]')
      .its('length')
      .then((n) => {
        setBulkAllocationForm(90);
        // expect: no errors, success message.
        cy.contains('.Mui-error').should('not.exist');
        cy.get('.MuiAlert-message').contains(`${n} sites have been assigned allocations`);
      });
  });

  it('Validates required fields', () => {
    cy.visit('site-view');
    navigateToFormSelectAll();

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
    navigateToFormSelectAll();
    cy.get('tr td')
      .find('[type="checkbox"]')
      .its('length')
      .then((n) => {
        const override = true;
        setBulkAllocationForm(200, override);
        cy.get('form').submit();

        // expect: no errors, success message.
        cy.get('[name=acknowledgement]').should('exist');
        cy.contains('.Mui-error').should('not.exist');
        cy.get('.MuiAlert-message').contains(`${n} sites have been assigned allocations`);
      });
  });
});
