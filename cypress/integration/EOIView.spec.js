describe('EOI View', () => {
  it('Checks the filtering options on EOI View as a superuser', () => {
    cy.kcLogin('test-superuser');
    cy.visit('/eoi-view');
    cy.get('div.MuiSelect-selectMenu').should('not.have.class', 'Mui-disabled');
    cy.get('div.MuiSelect-selectMenu').click();
    cy.get('ul.MuiMenu-list[role=listbox]').should('be.visible');
    cy.get('ul.MuiMenu-list[role=listbox] > li').should('have.length', 7);
  });

  it('Checks the filtering options on EOI View as a MoH user', () => {
    cy.kcLogin('test-moh');
    cy.visit('/eoi-view');
    cy.get('div.MuiSelect-selectMenu').should('not.have.class', 'Mui-disabled');
    cy.get('div.MuiSelect-selectMenu').click();
    cy.get('ul.MuiMenu-list[role=listbox]').should('be.visible');
    cy.get('ul.MuiMenu-list[role=listbox] > li').should('have.length', 7);
  });
});
