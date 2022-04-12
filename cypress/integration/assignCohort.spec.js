describe('Assign Cohort', () => {
  // THE PLAN:
  // need data/fixtures in place:
  // - at least 1 institution with 1 full cohort, 1 roomy
  // - at least 1 hired participant with no cohort
  // login as employer
  // navigate to the page
  // click the update status button
  // select institute
  // select cohort
  // click save changes
  // check for error message/success
  beforeEach(() => {
    cy.kcLogin('test-ha');
    cy.visit('participant-details/participant/none/1/track-graduation');
    cy.get('[test-id=updateGraduationStatus]').click();
  });
  afterEach(() => {
    cy.kcLogout();
  });
  it('Should allow a hired participant to be assigned to a cohort with seats', () => {});
  it('Should not allow a participant to be assigned to a full cohort', () => {});
});
