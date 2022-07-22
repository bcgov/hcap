describe('Return of Service Form', () => {
  before(() => {});

  beforeEach(() => {
    cy.kcLogin('test-ha');
  });

  afterEach(() => {
    cy.kcLogout();
  });

  it('Should be able to add ROS date in the future', () => {
    const participantId = 26;
    const maxValidDate = '2099/12/31';

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

    // set date to max future date: 2099/12/31
    cy.get('[name=ReturnofServiceStartDate]').clear().type(maxValidDate);

    // fill out rest of form in valid way, then blur focus
    cy.get('[value=casual]').click();
    cy.get('[value=full-time]').click();
    cy.get('[name=confirm]').click().blur();

    // SHOULD be valid
    cy.contains('#Mui-error').should('not.exist');

    // submit form
    cy.contains('button', 'Confirm').click();

    // SHOULD get success toast response
    cy.get('.MuiAlert-message').contains('Return of Service status updated');
  });
});
