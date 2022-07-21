describe('Participant View', () => {
  beforeEach(() => {
    cy.kcLogout();
  });

  it('Visits Participant View as a multi-region employer', () => {
    cy.kcLogin('test-employer-multi');
    cy.visit('/participant-view');
    cy.contains('Preferred Location').should('not.have.class', 'Mui-disabled');
    cy.contains('Preferred Location').should('not.have.class', 'Mui-disabled');
    cy.contains('Preferred Location').click();
    cy.get('ul.MuiMenu-list[role=listbox]').should('be.visible');
    cy.get('ul.MuiMenu-list[role=listbox] > li').should('have.length', 3);

    // Testing for freshness

    // cy.get('body').then(($body) => {
    //   if (Cypress.$('body:contains("a day ago")').length !== 0) {
    //     cy.contains('a day ago').should('exist');
    //     cy.contains('14 days ago').should('exist');
    //   } else {
    //     cy.contains('2 days ago').should('exist');
    //     cy.contains('15 days ago').should('exist');
    //   }
    // });

    // Testing Tabs
    cy.contains('My Sites').should('exist');
  });

  it('Visits Participant View as a single-region employer', () => {
    cy.kcLogin('test-employer');
    cy.visit('/participant-view');
    cy.contains('Fraser').should('have.class', 'Mui-disabled');
    cy.get('ul.MuiMenu-list').should('not.be.visible');

    // Testing Tabs
    cy.contains('My Sites').should('exist');
  });

  it('Visits Participant View as a superuser', () => {
    cy.kcLogin('test-superuser');
    cy.visit('/participant-view');
    cy.contains('Preferred Location').should('not.have.class', 'Mui-disabled');
    cy.contains('Preferred Location').click();
    cy.get('ul.MuiMenu-list[role=listbox]').should('be.visible');
    cy.get('ul.MuiMenu-list[role=listbox] > li').should('have.length', 6);

    // Testing Tabs
    cy.contains('My Sites').should('not.exist');
  });

  it('Visits Participant View as a MoH user', () => {
    cy.kcLogin('test-moh');
    cy.visit('/participant-view');
    cy.contains('Preferred Location').should('not.have.class', 'Mui-disabled');
    cy.contains('Preferred Location').click();
    cy.get('ul.MuiMenu-list[role=listbox]').should('be.visible');
    cy.get('ul.MuiMenu-list[role=listbox] > li').should('have.length', 6);
  });
});
