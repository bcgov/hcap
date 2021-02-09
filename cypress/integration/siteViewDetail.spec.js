describe("Tests the Site View Details", () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it("visits siteView as employer / maximus", () => {
    cy.kcNavAs("employer", "site-view");
    cy.contains("You don't have permission to view this content.").should('exist');
    cy.kcNavAs("maximus", "site-view");
    cy.contains("You don't have permission to view this content.").should('exist');
  });

  it("visits siteView as MoH", () => {
    cy.kcNavAs("ministry_of_health", "site-view");
    cy.contains('td', 1).should('exist');
    cy.contains('button', 'Details').click();
  });
});
