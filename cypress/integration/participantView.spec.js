describe("Participant View", () => {
  beforeEach(() => {
    cy.visit('/');
  })

  it("Uses the MoH edit feature", () => {
    cy.intercept('patch','/api/v1/participant', (req) => {
      expect(req.body.history[0].changes[0]).to.deep.equal({field: "firstName", from: "Graham", to: "Animal"});
      req.reply({ok: true});
    }).as('patchAnswer');
    cy.kcNavAs('ministry_of_health', 'participant-view');
    cy.contains('Edit').click();
    cy.get('div.MuiDialog-scrollPaper').should('exist');
    cy.get('input[name=firstName').should('have.value', 'Graham').clear().type('Animal');
    cy.contains('Save').focus().click();
    cy.wait('@patchAnswer');
    cy.get('div.MuiDialog-scrollPaper').should('not.exist');
  });

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

  it("Tests the manual participant adder", () => {
    const participantInfo = {
      "firstName": "Tiddly",
      "lastName": "Whiskers",
      "phoneNumber": "3141592654",
      "emailAddress": "tiddlywhiskers@ca.ts",
      "origin": "internal",
      "otherOrigin": '',
      "nonHcapOpportunity": false,
      "contactedDate": "2020/10/10",
      "hiredDate": "2020/11/11",
      "startDate": "2020/12/12",
      "site": 2,
      "acknowledge": true,
    };

    cy.kcNavAs('employer', 'participant-view');
    cy.intercept('post','api/v1/new-hired-participant', (req) => {
      expect(req.body.participantInfo).to.deep.equal(participantInfo);
    });

    cy.contains('Hired Candidates').click();
    cy.contains('Non-Portal').click();
    cy.get('input[name=firstName]').type("Tiddly");
    cy.get('input[name=lastName]').type("Whiskers");
    cy.get('input[name=phoneNumber]').type("3141592654");
    cy.get('input[name=emailAddress]').type("tiddlywhiskers@ca.ts");
    cy.get('div#mui-component-select-origin').click();
    cy.get('li').contains('Internal').click();
    cy.get('input[name=DateContacted]').type("20201010");
    cy.get('input[name=DateOfferAccepted]').type("20201111");
    cy.get('input[name=StartDate]').type("20201212");
    cy.get('div#mui-component-select-site').click();
    cy.get('li[data-value=2]').click();
    cy.get('input[name=acknowledge]').click();
    cy.get('button').contains('Submit').click();
  });

})
