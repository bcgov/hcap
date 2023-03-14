describe('Participants status suite', () => {
  // Ensure phases and allocations exist - to test alert message
  before(() => {
    cy.kcLogin('test-moh');
    setBulkAllocationForm();
    cy.kcLogout();
  });

  const setBulkAllocationForm = () => {
    cy.visit('site-view');
    cy.get('th').find('[type="checkbox"]').check();
    cy.contains('button', 'Set Allocation').click();
    cy.get('[name=phase_id]').parent().click();
    // use existing phase 'with PhaseNAme=Sacred Macaw
    cy.get('li').contains('Sacred Macaw').click();
    cy.get('[name=allocation]').clear().type(100);

    cy.contains('button', 'Set').click({ force: true });
    cy.get('form').submit();
  };

  const engageParticipantForm = (siteId) => {
    // click the select site input
    cy.get('#mui-component-select-prospectingSite').click();
    // select desired site
    cy.get(`li[data-value='${siteId}']`).click();
    // confirm
    cy.contains('button', 'Confirm').click();
    cy.contains('button', 'View My Candidates').click();
  };

  const interviewParticipantForm = () => {
    // let it select today as the date
    // Ensure dates selected are within the phase range of Sacred Macaw
    cy.get('input[name=ContactedDate]').clear().type('2023/01/13');
    cy.contains('button', 'Submit').click();
  };

  const hireParticipantForm = (siteId) => {
    // both dates
    // Ensure dates selected are within the phase range of Sacred Macaw
    cy.get('input[name=DateHired]').clear().type('2023/01/14');
    cy.get('input[name=StartDate]').clear().type('2023/01/15');
    // select site
    cy.get('#mui-component-select-site').click();
    cy.get(`li[data-value='${siteId}']`).click();
    // acknowledge participant accepted offer in writing
    cy.get('input[name="acknowledge"]').click();
    //  expect alert with allocations/remainingHires to exist
    cy.wait(1000);
    cy.get('.MuiAlert-message').contains(`This site has 100 allocations assigned`);

    cy.contains('button', 'Submit').click();
  };

  const archiveHiredParticipantForm = () => {
    // type: employment ended
    cy.get('#mui-component-select-type').click();
    cy.get('li[data-value="employmentEnded"]').click();

    // reason: Terminated
    cy.get('#mui-component-select-reason').click();
    cy.get('li[data-value="Terminated by employer"]').click();

    // status: Not begun
    cy.get('#mui-component-select-status').click();
    cy.get('li[data-value="Not begun orientation or training"]').click();

    // intend to rehire = Yes + acknowledge archiving irreversible
    cy.get('input[name="rehire"][value="Yes"]').click();
    cy.get('input[name="confirmed"]').click();

    cy.contains('button', 'Confirm').click();
  };

  const STEPS = [
    {
      status: 'available',
    },
    {
      status: 'prospecting',
      startTab: 'Available Participants',
      actionItem: 'Engage',
      fillFormFunction: engageParticipantForm,
      endTab: 'My Candidates',
    },
    {
      status: 'interviewing',
      startTab: 'My Candidates',
      actionItem: 'Interviewing',
      fillFormFunction: interviewParticipantForm,
      endTab: 'My Candidates',
    },
    {
      status: 'offer_made',
      startTab: 'My Candidates',
      actionItem: 'Offer Made',
      fillFormFunction: () => {}, // none, just click
      endTab: 'My Candidates',
    },
    {
      status: 'hired',
      startTab: 'My Candidates',
      actionItem: 'Hire',
      fillFormFunction: hireParticipantForm,
      endTab: 'Hired Candidates',
    },
  ];

  const progressParticipantHireStep = (step, participantId, siteId) => {
    const { startTab, actionItem, fillFormFunction, endTab } = step;
    // navigate to page and tab
    cy.visit('participant-view');
    cy.contains('button', startTab).click();

    cy.contains('td', participantId)
      .parent()
      .within(() => {
        // click the Actions button belonging to that participant
        // without force:true "failed because center of this element hidden from view"
        cy.contains('button', 'Actions').click({ force: true });
      });
    //click appropriate action
    cy.contains('li', actionItem).click({ force: true }); // same error, "center hidden from view"
    fillFormFunction(siteId);

    // expect to see candidate:
    cy.contains('button', endTab).click();
    cy.contains('td', participantId).should('exist');
  };

  const progressParticipantHire = (participantId, siteId, currentHireStep, endStep) => {
    let currentIndex = STEPS.findIndex((step) => step.status === currentHireStep);
    const endIndex = STEPS.findIndex((step) => step.status === endStep);

    while (currentIndex < endIndex) {
      currentIndex++;
      const nextStep = STEPS[currentIndex];
      progressParticipantHireStep(nextStep, participantId, siteId);
    }
  };

  const archiveParticipant = (participantId, startTab) => {
    progressParticipantHireStep(
      {
        startTab: startTab,
        actionItem: 'Archive',
        endTab: 'Archived Candidates',
        fillFormFunction: archiveHiredParticipantForm,
      },
      participantId,
      null
    );
  };

  const acknowledgeArchive = (participantId, startTab) => {
    cy.contains('button', startTab).click();
    cy.contains('td', participantId)
      .parent()
      .within(() => {
        // technically it's hover-activated but click works too
        cy.get('.MuiTableCell-body div svg').click();
      });
    cy.contains('button', 'Move to Archived Candidates').click();
  };

  it('Flow test: available --> engage by HA --> hired --> archived & acknowledged', () => {
    const participantId = 5;
    const hireSite = 1;
    // this needs to be an EXACT match- no "August 10" when we want participant 10!
    const participantIdRegex = new RegExp('^' + participantId + '$', 'g');

    cy.assignSitesToUser('test-ha', [hireSite]);

    // go from available status to hired status
    cy.kcLogin('test-ha');
    progressParticipantHire(participantIdRegex, hireSite, 'available', 'hired');

    // archive participant
    archiveParticipant(participantIdRegex, 'Hired Candidates');
    cy.kcLogout();
  });
});
