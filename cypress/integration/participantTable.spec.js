const fixture = require('../fixtures/participantTableTabs.json');

describe('Participant Table', () => {
  describe(`My Candidates tab`, () => {
    before(() => {
      // cy.assignSitesToHealthAuthorityUser('test-ha', [1]);
    });

    const EXPECTED_PARTICIPANTS = [
      {
        id: 28,
        description: 'participants with prospected as their current status',
        statusText: 'Prospecting',
      },
      {
        id: 29,
        description: 'participants with interviewing as their current status',
        statusText: 'Interviewing',
      },
      {
        id: 30,
        description: 'participants with offer_made as their current status',
        statusText: 'Offer Made',
      },
      {
        id: 32,
        description: 'participants hired to a different site than the one they were prospected to',
        statusText: 'Offer Made',
        hasTooltip: true,
      },
    ];

    const UNEXPECTED_PARTICIPANTS = [
      {
        id: 31,
        description: 'participants hired to the same site they were prospected to',
      },
    ];

    EXPECTED_PARTICIPANTS.forEach((participant) => {
      it(`Lists ${participant.description} users`, () => {
        cy.kcLogin('test-ha');
        cy.visit('/participant-view');
        cy.contains('button.MuiButtonBase-root', 'My Candidates').click();
        cy.contains('td', participant.id);
        cy.contains('td', participant.statusText);
        if (participant.hasTooltip) {
          cy.get(`[test-id=candidate-notification-${participant.id}]`);
        }
      });
    });

    UNEXPECTED_PARTICIPANTS.forEach((participant) => {
      it(`Does not list ${participant.description} users`, () => {
        cy.kcLogin('test-ha');
        cy.visit('/participant-view');
        cy.contains('button.MuiButtonBase-root', 'My Candidates').click();
        cy.wait(500);
        cy.contains('td', participant.id).should('not.exist');
      });
    });
  });

  fixture.roles.map((role) => {
    //   it(`Correctly renders tabs for ${role.name}`, () => {
    //     cy.kcLogin(role.fixture);
    //     cy.visit('/participant-view');
    //     cy.wait(1500);
    //     cy.get('div.MuiTabs-root')
    //       .find('button.MuiTab-root')
    //       .should('have.length', role.allTabs.length);
    //     role.allTabs.forEach((tab) => cy.get('button.MuiTab-root').contains(tab));
    //   });
    //   it(`Correctly renders columns for ${role.name}`, () => {
    //     cy.kcLogin(role.fixture);
    //     cy.visit('/participant-view');
    //     // TODO: Develop a way to read localStorage and check feature flags
    //     Object.entries(role.tableTabs).forEach((tab) => {
    //       const [tabText, tabHeaders] = [...tab];
    //       const hasActions = role.tabsWithActions.includes(tabText);
    //       const isMultiselect = role.tabsWithMultiselect.includes(tabText);
    //       let columnCount = tabHeaders.length;
    //       if (hasActions) columnCount++;
    //       if (isMultiselect) columnCount++;
    //       if (hasActions) cy.get('th.MuiTableCell-head').last().should('have.text', ''); // action column has no header
    //       cy.get('button.MuiTab-root').contains(tabText).click();
    //       cy.get('table.MuiTable-root').find('th').should('have.length', columnCount);
    //       tabHeaders.forEach((header) =>
    //         cy.get('span.MuiTableSortLabel-root[role=button]').contains(header)
    //       );
    //     });
    //   });
    // it(`Allows ${role.name} user to change rows per page`, () => {
    //   // go to the participant table
    //   cy.kcLogin(role.fixture);
    //   cy.visit('/participant-view');
    //   // for each possible pagination value:
    //   const pageSizes = [10, 30];
    //   pageSizes.forEach((size) => {
    //     // change to that value
    //     cy.get('[test-id=pageSizeSelect]').click();
    //     cy.get(`li[data-value='${size}']`).click();
    //     // verify # of participants on page
    //     cy.get('table.MuiTable-root')
    //       .find('tr')
    //       .should('have.length', size + 1);
    //     // try going to page #2 (if participants > pagination)
    //     cy.get('button[aria-label="next page"]');
    //     if (role.allTabs.includes('My Candidates')) {
    //       // try going to a different tab
    //       cy.contains('button.MuiButtonBase-root', 'My Candidates').click();
    //       // make sure page size gets brought over to new tab
    //       cy.get('[test-id=pageSizeSelect]').contains(size);
    //       // return to default tab for next test
    //       cy.contains('button.MuiButtonBase-root', 'Available Participants').click();
    //     }
    //   });
    // });
  });
});
