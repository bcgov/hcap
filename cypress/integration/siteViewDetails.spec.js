describe('Tests the Site Details View', () => {
  it('creates a new site as MoH, asserts that it has default functionality', () => {
    cy.kcLogin('test-moh');
    cy.visit('/site-view');
    cy.get('span.MuiButton-label', { timeout: 10000 }).should('include.text', 'Action');
    cy.get('span.MuiButton-label').contains('Action').click();
    cy.get('li.MuiListItem-button', { timeout: 10000 }).should('include.text', 'Create new site');
    cy.get('li.MuiListItem-button').contains('Create new site').click();
    // Site Key Details
    cy.get('input#siteId').focus().type('2020');
    cy.get('input#siteName').focus().type('New Site');
    cy.get('input#address').focus().type('13920 Main st');
    cy.get('input#city').focus().type('Victoria');
    cy.get('input#postalCode').focus().type('V1V1V1');
    cy.get('label.MuiFormControlLabel-root').contains('No').click();
    cy.get('div#mui-component-select-healthAuthority').click();
    cy.get('li').contains('Fraser Health').click();
    cy.get('[name=siteType]').parent().click();
    cy.get('li').contains('Private').click();
    // Additional Site Info
    cy.get('input#registeredBusinessName').clear().type('Sallys Operation INC');
    // Operator Info
    cy.get('input#operatorName').clear().type('Sallys Operation');
    cy.get('input#operatorContactFirstName').clear().type('Sally');
    cy.get('input#operatorContactLastName').clear().type('Smith');
    cy.get('input#operatorPhone').clear().type('3334521111');
    cy.get('input#operatorEmail').clear().type('sally.smith@co.com');

    // Site Contact
    cy.get('input#siteContactFirstName').clear().type('Becca');
    cy.get('input#siteContactLastName').clear().type('Bronson');
    cy.get('input#siteContactPhone').clear().type('5554521111');
    cy.get('input#siteContactEmail').clear().type('becca.bronson@co.com');
    cy.get('span.MuiButton-label').contains('Submit').click();
    cy.contains('2020')
      .parent('tr')
      .within(() => {
        cy.get('button').click({ force: true });
      });
    cy.get('button.Mui-selected').should('have.text', 'Site Details');
  });

  it('creates a new site as MoH, gets error site name is too long', () => {
    const longSiteName =
      'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem.';
    cy.kcLogin('test-moh');
    cy.visit('/site-view');
    cy.get('span.MuiButton-label', { timeout: 10000 }).should('include.text', 'Action');
    cy.get('span.MuiButton-label').contains('Action').click();
    cy.get('li.MuiListItem-button', { timeout: 10000 }).should('include.text', 'Create new site');
    cy.get('li.MuiListItem-button').contains('Create new site').click();
    cy.get('input#siteId').focus().type('2020');
    cy.get('input#siteName').focus().type(longSiteName);

    cy.get('span.MuiButton-label').contains('Submit').click();
    // show have error
    cy.contains('p.Mui-error', 'Site name should be no longer than 255 characters');
  });

  it('edits a site and confirms the new data is rendered', () => {
    cy.kcLogin('test-moh');
    cy.visit('/site-view');
    cy.contains('V1V1V1');
    cy.get('button').contains('details').click();
    cy.get('button').contains('Edit').click();
    cy.get('input#siteContactFirstName').clear().type('newName');
    cy.get('input#siteContactLastName').clear().type('Name');
    cy.get('input#siteContactPhone').clear().type('1111223333');
    cy.get('input#siteContactEmail').clear().type('email@addr.ess');
    cy.get('input#siteName').clear().type('IGotAName');
    cy.get('input#registeredBusinessName').clear().type('JimCroce');
    cy.get('input#address').clear().type('123 Place');
    cy.get('input#city').clear().type('Victoria');
    cy.get('label.MuiFormControlLabel-root').contains('No').click();
    cy.get('input#postalCode').clear().type('V1V1V1');
    cy.get('[name=siteType]').parent().click();
    cy.get('li').contains('Acute').click();
    cy.get('input#operatorContactFirstName').clear().type('Sylvan');
    cy.get('input#operatorContactLastName').clear().type('Esso');
    cy.get('input#operatorPhone').clear().type('3332221111');
    cy.get('input#operatorEmail').clear().type('rooftop@danci.ng');
    cy.get('button').contains('Submit').click();
    cy.get('div.MuiDialog-container').should('not.exist');
    cy.contains('newName').should('exist');
  });

  it('visits the Site Details View as health authority', () => {
    cy.kcLogin('test-ha');
    cy.visit('/site-view');
    cy.get('span.MuiButton-label', { timeout: 10000 }).should('include.text', 'details');
    cy.get('span.MuiButton-label').contains('details').click();
    cy.get('button.Mui-selected').should('have.text', 'Site Details');
  });
});
