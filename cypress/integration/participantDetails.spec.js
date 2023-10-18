describe('Participant details view', () => {
  before(() => {
    cy.assignSitesToUser('test-employer', [4444]); // fraser
    cy.assignSitesToUser('test-ha', [4444]);
    cy.assignSitesToUser('test-mhsu-employer', [4444, 6666]); // fraser, interior
  });
  describe('Health Authority', () => {
    beforeEach(() => {
      cy.kcLogin('test-ha');
    });
    it('Should be able to assign cohort and track graduation', () => {
      cy.visit('participant-details/participant/na/119');
      cy.get('button.MuiTab-root').contains('Track Graduation');
      cy.get('button.MuiTab-root').contains('Assign Cohort');
    });
  });

  describe('Private Employer', () => {
    beforeEach(() => {
      cy.kcLogin('test-employer');
    });
    it('Should only be able to track graduation', () => {
      cy.visit('participant-details/participant/na/312');
      cy.get('button.MuiTab-root').contains('Track Graduation');
      cy.get('button.MuiTab-root').contains('Assign Cohort').should('not.exist');
    });
  });

  describe('MHSU Employer', () => {
    beforeEach(() => {
      cy.kcLogin('test-mhsu-employer');
    });
    it('Should only be able to track graduation', () => {
      cy.visit('participant-details/participant/na/480');
      cy.get('button.MuiTab-root').contains('Track Graduation');
      cy.get('button.MuiTab-root').contains('Assign Cohort').should('not.exist');
    });
  });
});
