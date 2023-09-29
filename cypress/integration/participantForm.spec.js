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

  it('should show/ hide Q11 - only for MHSU applicants', () => {
    visitParticipantForm();
    // should show
    cy.contains('span', 'Mental Health and Addictions Worker - HCAP').click();
    cy.contains(
      'b',
      '11. Do you have lived or living experience of mental health and/or substance use challenges?'
    ).should('be.visible');
    // should hide
    cy.contains('span', 'Health Care Assistant - HCAP').click();
    cy.contains(
      'b',
      '11. Do you have lived or living experience of mental health and/or substance use challenges?'
    ).should('not.exist');
  });

  it('should show Q15 - Q1 - MHAW track/ Q14 - Health care and social assistance', () => {
    visitParticipantForm();
    cy.contains('span', 'Mental Health and Addictions Worker - HCAP').click();
    // Health care and social assistance
    cy.contains('span', 'Health care and social assistance').click();

    cy.contains(
      'b',
      '15. Does/did this role involve delivering mental health and/or substance use services?'
    ).should('be.visible');
  });

  it('should show Q15 - Q1 - MHAW track/ Q14 - Community Social Services', () => {
    visitParticipantForm();
    cy.contains('span', 'Mental Health and Addictions Worker - HCAP').click();
    // Community Social Services
    cy.contains('span', 'Community Social Services').click();

    cy.contains(
      'b',
      '15. Does/did this role involve delivering mental health and/or substance use services?'
    ).should('be.visible');
  });

  it('should show Q15 - Q1 - MHAW track/ Q14 - Continuing Care and Community Health Care', () => {
    visitParticipantForm();
    cy.contains('span', 'Mental Health and Addictions Worker - HCAP').click();
    // Continuing Care and Community Health Care
    cy.contains('span', 'Continuing Care and Community Health Care').click();

    cy.contains(
      'b',
      '15. Does/did this role involve delivering mental health and/or substance use services?'
    ).should('be.visible');
  });

  it('should NOT show Q15 with HCA track', () => {
    visitParticipantForm();
    // click one of 3 conditional options for Q15 but select HCA track
    cy.contains('span', 'Health Care Assistant - HCAP').click();
    cy.contains('span', 'Continuing Care and Community Health Care').click();
    cy.contains(
      'b',
      '15. Does/did this role involve delivering mental health and/or substance use services?'
    ).should('not.exist');
  });
});
