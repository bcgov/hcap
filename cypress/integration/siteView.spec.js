describe('Tests the Site View', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('visits siteView as employer / maximus', () => {
    cy.kcNavAs('employer', 'site-view');
    cy.contains("You don't have permission to view this content.").should('exist');
    cy.kcNavAs('maximus', 'site-view');
    cy.contains("You don't have permission to view this content.").should('exist');
  });

  it('visits siteView as MoH', () => {
    cy.kcNavAs('ministry_of_health', 'site-view');
    cy.contains('td', 1).should('exist');
    cy.get('div.MuiSelect-selectMenu').should('not.have.class', 'Mui-disabled');
    cy.get('div.MuiSelect-selectMenu').click();
    cy.get('ul.MuiMenu-list[role=listbox]').should('be.visible');
    cy.get('ul.MuiMenu-list[role=listbox] > li').should('have.length', 7);
    cy.get('ul.MuiMenu-list[role=listbox] > li').contains('Northern').click();

    cy.contains('th', 'Site ID').click();
    cy.contains('th', 'Site Name').click();
    cy.contains('th', 'Operator Name').click();
    cy.contains('th', 'Health Authority').click();
    cy.contains('th', 'Postal Code').click();

    cy.get('div.MuiSelect-selectMenu').click();
    cy.get('ul.MuiMenu-list[role=listbox] > li').contains('None').click();
    cy.contains('td', 1).should('not.exist');
  });

  it('visits siteView as Health Authority', () => {
    cy.kcNavAs('health_authority_northern', 'site-view');
    cy.contains('td', 1).should('exist');
    cy.get('div.MuiSelect-selectMenu').should('have.class', 'Mui-disabled');
    cy.get('div.MuiSelect-selectMenu').click();

    cy.contains('th', 'Site ID').click();
    cy.contains('th', 'Site Name').click();
    cy.contains('th', 'Operator Name').click();
    cy.contains('th', 'Health Authority').click();
    cy.contains('th', 'Postal Code').click();
  });
});
