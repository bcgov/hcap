const fixture = require('../fixtures/participant-data.json');

describe('e2e test for participant landing page', () => {
  before(() => {
    // Create one participant
    cy.kcLogin('test-superuser');
    cy.visit('/'); // without this, session might not be restored completely
    cy.callAPI({
      user: 'test-superuser',
      api: '/participants',
      body: fixture,
      status: 201,
    });
  });

  after(() => {
    cy.kcLogin('test-superuser');
    cy.visit('/');
    cy.callAPI({
      user: 'test-superuser',
      api: '/participants',
      method: 'DELETE',
      body: {
        email: fixture.emailAddress,
      },
      status: 200,
    });
  });

  // Load
  it('should load participant page', () => {
    cy.kcLogin('test-participant');
    // Test Landing page
    cy.visit(`${Cypress.env('participantBaseUrl')}/participant-landing`);
    cy.wait(1000);
    cy.contains('button', 'Logout');
    cy.contains('button', 'Home');
    cy.contains('button', 'View PEOI').click({ force: true });
    cy.wait(1000);
    // Test PEOI
    cy.url().should('contain', 'participant-eoi/');
    cy.get('div#participant-view').should('be.visible');
  });
});
