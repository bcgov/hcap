describe('Participant details view', () => {
  before(() => {
    cy.assignSitesToUser('test-employer', [1111]);
    cy.assignSitesToUser('test-ha', [1111]);
  });
  describe('Health Authority', () => {
    beforeEach(() => {
      cy.kcLogin('test-ha');
    });
    afterEach(() => {
      cy.kcLogout();
    });
    it('Should be able to assign cohort and track graduation', () => {
      cy.visit('participant-details/participant/na/27');
      cy.get('button.MuiTab-root').contains('Track Graduation');
      cy.get('button.MuiTab-root').contains('Assign Cohort');
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
      cy.visit('participant-details/participant/na/28');
      cy.get('button.MuiTab-root').contains('Track Graduation');
      cy.get('button.MuiTab-root').contains('Assign Cohort').should('not.exist');
    });
  });
});
