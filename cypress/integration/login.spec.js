describe('Login', () => {
  beforeEach(() => {
    cy.kcLogout();
  });

  it('logs in as superuser and tests the admin page', () => {
    cy.kcLogin('test-superuser');
    cy.visit('/admin');
    cy.contains('Upload Participants').should('exist');
    cy.contains('View Participants').should('exist');
    cy.contains('View Employer EOIs').should('exist');
    cy.contains('View Sites').should('exist');
    cy.contains('View Access Requests').should('exist');
    cy.contains('Manage Users').should('exist');
    cy.contains('View Milestone Reports').should('exist');
  });

  it('logs in as a MoH user and tests the admin page', () => {
    cy.kcLogin('test-moh');
    cy.visit('/admin');
    cy.contains('Upload Participants').should('not.exist');
    cy.contains('View Participants').should('exist');
    cy.contains('View Employer EOIs').should('exist');
    cy.contains('View Sites').should('exist');
    cy.contains('View Access Requests').should('exist');
    cy.contains('Manage Users').should('exist');
    cy.contains('View Milestone Reports').should('exist');
  });

  it('logs in as a health authority user and tests the admin page', () => {
    cy.kcLogin('test-ha');
    cy.visit('/admin');
    cy.contains('Upload Participants').should('not.exist');
    cy.contains('View Participants').should('exist');
    cy.contains('View Employer EOIs').should('exist');
    cy.contains('View Sites').should('exist');
    cy.contains('View Access Requests').should('not.exist');
    cy.contains('Manage Users').should('not.exist');
    cy.contains('View Milestone Reports').should('not.exist');
  });

  it('logs in as an employer and tests /admin redirection', () => {
    cy.kcLogin('test-employer');
    cy.visit('/admin');
    cy.location().should((loc) => {
      expect(loc.pathname).to.eq('/participant-view');
    });
  });
});
