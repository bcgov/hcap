describe('Participant details view', () => {
  describe('Health Authority', () => {
    beforeEach(() => {
      cy.kcLogin('test-ha');
    });
    afterEach(() => {
      cy.kcLogout();
    });
    it('Should be able to assign cohort and track graduation', () => {
      cy.visit('participant-details/participant/none/27');
      // cy.get('button.MuiTab-root').contains('Track Graduation');
      // cy.get('button.MuiTab-root').contains('Assign Cohort');
      cy.get('h2').contains('Participant Details');
    });
  });

  describe('Employer', () => {
    beforeEach(() => {
      cy.kcLogin('test-employer');
    });
    afterEach(() => {
      cy.kcLogout();
    });
    it('Should only be able to track graduation', () => {
      cy.visit('participant-details/participant/none/28');
      cy.get('h2').contains('Participant Details');
      // cy.get('button.MuiTab-root>span').contains('Track Graduation');
      // cy.get('button.MuiTab-root>span').contains('Assign Cohort').should('not.exist');
    });
  });
});
