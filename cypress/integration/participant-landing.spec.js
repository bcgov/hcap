const fixture = require('../fixtures/participant-data.json');

describe('e2e test for participant landing page', () => {
  before(() => {
    // Create one participant
    cy.callAPI({
      api: '/participants',
      body: fixture,
    });
  });

  after(() => {
    cy.callAPI({
      api: '/participants',
      method: 'DELETE',
      body: {
        email: fixture.emailAddress,
      },
    });
  });

  beforeEach(() => {
    cy.kcLogout();
  });

  afterEach(() => {
    cy.kcLogout();
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
    cy.find('div#participant-view');
  });
});
