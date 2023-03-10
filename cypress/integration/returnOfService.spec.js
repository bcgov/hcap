describe('Return of Service Form', () => {
  before(() => {
    // assign site to test-ha as moh
    cy.assignSitesToUser('test-ha', [1]);
  });

  beforeEach(() => {
    cy.kcLogin('test-ha');
  });

  afterEach(() => {
    cy.kcLogout();
  });

  const maxValidDate = '2099/12/31';
  const futureInvalidDate = '2100/01/01';

  it('Should validate required fields', () => {
    const participantId = 27;
    // go to participant view
    cy.visit('participant-view');

    // go to hired tab
    cy.contains('button', 'Hired Candidates').click();

    // find a hired participant
    cy.contains('td', participantId)
      .parent()
      .within(() => {
        // click the Actions button belonging to that participant
        cy.get('td:last-child button').click();
      });

    // click Return of Service
    cy.contains('li', 'Return Of Service').click();
    // go to hired tab
    cy.contains('button', 'Confirm').click();

    // expect: required error on every field
    cy.contains('p.Mui-error', 'Return of service date is required');
    cy.contains('p.Mui-error', 'Position Type is required');
    cy.contains('p.Mui-error', 'Please confirm');
    cy.contains('p.Mui-error', 'Employment Type is required');
  });

  it('Should produce error when ROS date is past max valid date', () => {
    const participantId = 27;
    completeROSForm(participantId, futureInvalidDate);

    cy.get('.Mui-error').contains(
      'Invalid entry. Date must be after December 31st 1899 and before January 1st 2100.'
    );
  });

  it('Should be able to add ROS date in the future', () => {
    const participantId = 26;

    completeROSForm(participantId, maxValidDate);

    // SHOULD be valid
    cy.contains('#Mui-error').should('not.exist');

    // submit form
    cy.contains('button', 'Confirm').click();

    // should get success toast response
    cy.get('.MuiAlert-message').contains('Successfully updated Return of Service status!');
  });

  const completeROSForm = (participantId, startDateString) => {
    // go to participant view
    cy.visit('participant-view');

    // go to hired tab
    cy.contains('button', 'Hired Candidates').click();

    // find a hired participant
    cy.contains('td', participantId)
      .parent()
      .within(() => {
        // click the Actions button belonging to that participant
        cy.get('td:last-child button').click();
      });

    // click Return of Service
    cy.contains('li', 'Return Of Service').click();

    // set date to given date
    cy.get('[name=ReturnofServiceStartDate]').clear().type(startDateString);

    // fill out rest of form in valid way, then blur focus
    cy.get('[value=casual]').click();
    cy.get('[value=full-time]').click();
    cy.get('[name=confirm]').click().blur();
  };
});
