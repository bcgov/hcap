describe('e2e test for participant EOI form', () => {
  const visitParticipantForm = () => {
    cy.visit(`${Cypress.env('participantBaseUrl')}/participant-form`);
    cy.wait(1000);
    cy.contains('h2', 'Health Career Access Program - Expression of Interest');
    cy.wait(1000);
  };

  it('should load participant EOI form', () => {
    visitParticipantForm();
  });

  it('should only offer the Health Care Assistant - HCAP pathway', () => {
    visitParticipantForm();
    cy.contains('span', 'Health Care Assistant - HCAP').should('be.visible');
    cy.contains('span', 'Mental Health and Addictions Worker - HCAP').should('not.exist');
  });
});
