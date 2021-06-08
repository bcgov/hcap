describe('Participant View', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('Visits Participant View as a multi-region employer', () => {
    cy.kcNavAs('employer_island_fraser', 'participant-view');
    cy.contains('Preferred Location').should('not.have.class', 'Mui-disabled');
    cy.contains('Preferred Location').should('not.have.class', 'Mui-disabled');
    cy.contains('Preferred Location').click();
    cy.get('ul.MuiMenu-list[role=listbox]').should('be.visible');
    cy.get('ul.MuiMenu-list[role=listbox] > li').should('have.length', 3);

    // Testing for freshness

    cy.get('body').then(($body) => {
      if (Cypress.$('body:contains("a day ago")').length !== 0) {
        cy.contains('a day ago').should('exist');
        cy.contains('14 days ago').should('exist');
      } else {
        cy.contains('2 days ago').should('exist');
        cy.contains('15 days ago').should('exist');
      }
    });

    // Testing Tabs
    cy.contains('My Sites').should('not.exist');
  });

  it('Visits Participant View as a single-region employer', () => {
    cy.kcNavAs('employer_island', 'participant-view');
    cy.contains('Vancouver Island').should('have.class', 'Mui-disabled');
    cy.get('ul.MuiMenu-list').should('not.be.visible');

    // Testing Tabs
    cy.contains('My Sites').should('not.exist');
  });

  it('Visits Participant View as a superuser', () => {
    cy.kcNavAs('superuser', 'participant-view');
    cy.contains('Preferred Location').should('not.have.class', 'Mui-disabled');
    cy.contains('Preferred Location').click();
    cy.get('ul.MuiMenu-list[role=listbox]').should('be.visible');
    cy.get('ul.MuiMenu-list[role=listbox] > li').should('have.length', 6);

    // Testing Tabs
    cy.get('ul.MuiMenu-list[role=listbox]').first().click();
    cy.get('button#sitesTab').click();
    cy.contains('My Sites').should('exist');
  });

  it('Visits Participant View as a MoH user', () => {
    cy.kcNavAs('ministry_of_health', 'participant-view');
    cy.contains('Preferred Location').should('not.have.class', 'Mui-disabled');
    cy.contains('Preferred Location').click();
    cy.get('ul.MuiMenu-list[role=listbox]').should('be.visible');
    cy.get('ul.MuiMenu-list[role=listbox] > li').should('have.length', 6);

    // Testing Tabs - DESCOPED FOR 165
    // cy.get('ul.MuiMenu-list[role=listbox]').first().click();
    // cy.get("button#sitesTab").click();
    // cy.contains("My Sites").should('exist');
  });

  it('Uses the MoH edit feature', () => {
    cy.intercept('patch', '/api/v1/participant', (req) => {
      expect(req.body.history[0].changes[0]).to.deep.equal({
        field: 'firstName',
        from: 'Graham',
        to: 'Animal',
      });
      req.reply({ ok: true });
    }).as('patchAnswer');
    cy.kcNavAs('ministry_of_health', 'participant-view');
    cy.contains('Edit').click();
    cy.get('div.MuiDialog-scrollPaper').should('exist');
    cy.get('input[name=firstName').should('have.value', 'Graham').clear().type('Animal');
    cy.contains('Save').focus().click();
    cy.wait('@patchAnswer');
    cy.get('div.MuiDialog-scrollPaper').should('not.exist');
  });
});
