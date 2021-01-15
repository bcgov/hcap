describe("Participant View", () => {
  beforeEach(() => {
    cy.visit('/');
  })

  it("Visits Participant View as a multi-region employer", () => {
    cy.kcNavAs('employer_island_fraser', 'participant-view');
    cy.get('div.MuiSelect-selectMenu').should('not.have.class', 'Mui-disabled');
    cy.get('div.MuiSelect-selectMenu').click();
    cy.get('ul.MuiMenu-list[role=listbox]').should('be.visible');
    cy.get('ul.MuiMenu-list[role=listbox] > li').should('have.length', 3);
  });

  it("Visits Participant View as a single-region employer", () => {
    cy.kcNavAs('employer_island', 'participant-view');
    cy.get('div.MuiSelect-selectMenu').should('have.class', 'Mui-disabled');
    cy.get('div.MuiSelect-selectMenu').click();
    cy.get('ul.MuiMenu-list').should('not.be.visible');
  });

  it("Visits Participant View as a superuser", () => {
    cy.kcNavAs('superuser', 'participant-view');
    cy.get('div.MuiSelect-selectMenu').should('not.have.class', 'Mui-disabled');
    cy.get('div.MuiSelect-selectMenu').click();
    cy.get('ul.MuiMenu-list[role=listbox]').should('be.visible');
    cy.get('ul.MuiMenu-list[role=listbox] > li').should('have.length', 6);
  });

  it("Visits Participant View as a MoH user", () => {
    cy.kcNavAs('ministry_of_health', 'participant-view');
    cy.get('div.MuiSelect-selectMenu').should('not.have.class', 'Mui-disabled');
    cy.get('div.MuiSelect-selectMenu').click();
    cy.get('ul.MuiMenu-list[role=listbox]').should('be.visible');
    cy.get('ul.MuiMenu-list[role=listbox] > li').should('have.length', 6);
  });
})
