const fixture = require('../fixtures/participantTableTabs.json');

describe('Participant Table', () => {
  fixture.roles.map((role) => {
    it(`Correctly renders tabs for ${role.name}`, () => {
      cy.kcLogin(role.fixture);
      cy.intercept(`${Cypress.env('apiBaseURL')}/participants?*`).as('participantGet');
      // Wait for page to load after click
      cy.visit('/participant-view');

      cy.wait('@participantGet');
      cy.get('div.MuiTabs-root')
        .find('button.MuiTab-root')
        .should('have.length', role.allTabs.length);
      role.allTabs.forEach((tab) => cy.get('button.MuiTab-root').contains(tab));
    });

    it(`Correctly renders columns for ${role.name}`, () => {
      cy.kcLogin(role.fixture);
      cy.visit('/participant-view');

      // TODO: Develop a way to read localStorage and check feature flags
      Object.entries(role.tableTabs).forEach((tab) => {
        const [tabText, tabHeaders] = [...tab];

        const hasActions = role.tabsWithActions.includes(tabText);
        const isMultiselect = role.tabsWithMultiselect.includes(tabText);
        let columnCount = tabHeaders.length;
        if (hasActions) columnCount++;
        if (isMultiselect) columnCount++;

        if (hasActions) cy.get('th.MuiTableCell-head').last().should('have.text', ''); // action column has no header

        cy.get('button.MuiTab-root').contains(tabText).click();

        cy.get('table.MuiTable-root').find('th').should('have.length', columnCount);

        tabHeaders.forEach((header) =>
          cy.get('span.MuiTableSortLabel-root[role=button]').contains(header)
        );
      });
    });

    it(`Allows ${role.name} user to change rows per page`, () => {
      // go to the participant table
      cy.kcLogin(role.fixture);
      cy.visit('/participant-view');

      // for each possible pagination value:
      const pageSizes = [10, 30];
      pageSizes.forEach((size) => {
        // change to that value
        cy.get('[test-id=pageSizeSelect]').click();
        cy.get(`li[data-value='${size}']`).click();

        // verify # of participants on page
        cy.get('table.MuiTable-root')
          .find('tr')
          .should('have.length', size + 1);
        // try going to page #2 (if participants > pagination)
        cy.get('button[aria-label="next page"]');

        if (role.allTabs.includes('My Candidates')) {
          // try going to a different tab
          cy.contains('button.MuiButtonBase-root', 'My Candidates').click();
          // make sure page size gets brought over to new tab
          cy.get('[test-id=pageSizeSelect]').contains(size);
          // return to default tab for next test
          cy.contains('button.MuiButtonBase-root', 'Available Participants').click();
        }
      });
    });
  });
});
