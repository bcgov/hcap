const fixture = require('../fixtures/participantTableTabs.json');

describe('Participant Table', () => {
  fixture.roles.map((role) => {
    it(`Correctly renders tabs for ${role.name}`, () => {
      cy.kcLogin(role.fixture);
      cy.visit('/participant-view');
      cy.wait(1500);
      cy.get('div.MuiTabs-root')
        .find('button.MuiTab-root')
        .should('have.length', role.allTabs.length);
      role.allTabs.forEach((tab) => cy.get('button.MuiTab-root').contains(tab));
    });

    it(`Correctly renders columns for ${role.name}`, () => {
      cy.kcLogin(role.fixture);
      cy.visit('/participant-view');
      Object.entries(role.tableTabs).forEach((tab) => {
        const [tabText, tabHeaders] = [...tab];

        const hasActions = role.tabsWithActions.includes(tabText);
        const isMultiselect = role.tabsWithMultiselect.includes(tabText);
        const columnCount = tabHeaders.length;
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
  });
});
