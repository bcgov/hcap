import { makeCohortAssignment, makeTestSite } from '../../server/tests/util/integrationTestData';

describe('Return of Service Form', () => {
  beforeAll(() => {
    // create test data: PSI, cohort, participant
    const {
      participantId: futureParticipantId,
      psiId,
      cohortId,
    } = makeCohortAssignment({
      cohortName: 'Test Cohort',
      cohortId: '',
      email: 'futura.futurismo@hcap.club',
      participantId: '',
      psiName: 'Test PSI',
      psiId: '',
    });

    const testSite = makeTestSite({ siteId: 12, city: 'city name', siteName: 'Test site' });

    // TODO: hire candidate.

    // TODO: graduate candidate
  });
  beforeEach(() => {
    cy.kcLogin('test-ha');
  });
  afterEach(() => {
    cy.kcLogout();
  });

  it('Should be able to add ROS date in the future', () => {
    // hire the
    const maxValidDate = '2099/12/31';
    // go to participant view
    cy.visit('participant-view');

    // go to hired tab
    cy.contains('button', 'Hired Candidates').click();

    // find a hired participant
    cy.contains(futureParticipantId)
      .parent()
      .within(() => {
        // click the Actions button belonging to that participant
        cy.contains('button', 'Actions').click();
        // click Return of Service
        cy.contains('li', 'Return of Service').click();
      });

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
    // TODO: the class should be correct, but the message is certainly not
    cy.get('.MuiAlert-message').contains('Success message');
  });
});
