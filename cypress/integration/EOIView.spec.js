describe("EOI View", () => {
  beforeEach(() => {
    cy.visit('/');
  })

  it("Checks the filtering options on EOI View as a superuser", () => {
    cy.kcNavAs('superuser', 'eoi-view');
    cy.get('div.MuiSelect-selectMenu').should('not.have.class', 'Mui-disabled');
    cy.get('div.MuiSelect-selectMenu').click();
    cy.get('ul.MuiMenu-list[role=listbox]').should('be.visible');
    cy.get('ul.MuiMenu-list[role=listbox] > li').should('have.length', 7);
  });

  it("Checks the filtering options on EOI View as a MoH user", () => {
    cy.kcNavAs('ministry_of_health', 'eoi-view');
    cy.get('div.MuiSelect-selectMenu').should('not.have.class', 'Mui-disabled');
    cy.get('div.MuiSelect-selectMenu').click();
    cy.get('ul.MuiMenu-list[role=listbox]').should('be.visible');
    cy.get('ul.MuiMenu-list[role=listbox] > li').should('have.length', 7);
  });
})
