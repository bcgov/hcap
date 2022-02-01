describe('EOI View', () => {
  beforeEach(() => {
    cy.kcLogin('test-moh');
  });
  afterEach(() => {
    cy.kcLogout();
  });
  it('Should be able edit participant details', () => {
    cy.visit('participant-details/participant/1');
    cy.get('[test-id=editInfoButton]').click();
    // Generate a new first name
    const newName = 'New Name' + Math.floor(Math.random() * 10000);
    // Edit first name
    cy.get('[test-id=editParticipantFirstName]>div>input').clear().type(newName);
    // Save
    cy.get('[test-id=editParticipantSave]').click();
    // Verify that saved results shows up
    cy.get('[test-id=participantDetailsViewfullName]').should('contain', newName);
  });
});
