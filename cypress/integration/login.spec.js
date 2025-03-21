describe('Login', () => {
  it('logs in as superuser and tests the admin page', () => {
    cy.kcLogin('test-superuser');
    cy.visit('/admin');
    cy.contains('View Participants').should('exist');
    cy.contains('View Employer EOIs').should('exist');
    cy.contains('View Sites').should('exist');
    cy.contains('View Access Requests').should('exist');
    cy.contains('Manage Users').should('exist');
    cy.contains('Reporting').should('exist');
    cy.contains('Manage PSI').should('exist');
  });

  it('logs in as a MoH user and tests the admin page', () => {
    cy.kcLogin('test-moh');
    cy.visit('/admin');
    cy.contains('View Participants').should('exist');
    cy.contains('View Employer EOIs').should('exist');
    cy.contains('View Sites').should('exist');
    cy.contains('View Access Requests').should('exist');
    cy.contains('Manage Users').should('exist');
    cy.contains('Reporting').should('exist');
    cy.contains('Manage PSI').should('exist');
  });

  it('logs in as a health authority user and tests the admin page', () => {
    cy.kcLogin('test-ha');
    cy.visit('/admin');
    cy.contains('View Participants').should('exist');
    cy.contains('View Employer EOIs').should('exist');
    cy.contains('View Sites').should('exist');
    cy.contains('View Access Requests').should('not.exist');
    cy.contains('Reporting').should('exist');
    cy.contains('Manage Users').should('not.exist');
    cy.contains('Manage PSI').should('exist');
  });

  it('logs in as a private employer and tests /admin redirection', () => {
    cy.kcLogin('test-employer');
    cy.visit('/admin');
    cy.location().should((loc) => {
      expect(loc.pathname).to.eq('/participant-view');
    });
  });

  it('logs in as a mhsu employer and tests /admin redirection', () => {
    cy.kcLogin('test-mhsu-employer');
    cy.visit('/admin');
    cy.location().should((loc) => {
      expect(loc.pathname).to.eq('/participant-view');
    });
  });
});
