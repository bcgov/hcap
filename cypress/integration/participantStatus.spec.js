describe('Participants status suite', () => {
  const engageParticipantForm = (siteId) => {
    // click the select site input
    cy.get('#mui-component-select-prospectingSite').click();
    // select desired site
    cy.get(`li[data-value='${siteId}']`).click();
    // confirm
    cy.contains('button', 'Confirm').click();
    cy.contains('button', 'View My Candidates').click();
  };

  const interviewParticipantForm = (siteId) => {
    // let it select today as the date
    cy.get('input[name=ContactedDate]').clear().type('2022/01/13');
    cy.contains('button', 'Submit').click();
  };

  const hireParticipantForm = (siteId) => {
    // both dates
    cy.get('input[name=DateHired]').clear().type('2022/01/14');
    cy.get('input[name=StartDate]').clear().type('2022/01/15');
    // select site
    cy.get('#mui-component-select-site').click();
    cy.get(`li[data-value='${siteId}']`).click();
    // acknowledge participant accepted offer in writing
    cy.get('input[name="acknowledge"]').click();

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
      endTab: 'My Candidates',
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

  it('Flow test: available --> engaged by PE --> hired to a different site by HA --> archived & acknowledged by HA --> acknowledged by PE', () => {
    const participantId = 4;
    // this needs to be an EXACT match- no "August 10" when we want participant 10!
    const participantIdRegex = new RegExp('^' + participantId + '$', 'g');

    // pre-requisites: HA & PE have 2 sites in common, A/1, and B/4
    cy.assignSitesToUser('test-ha', [1, 4]);
    cy.assignSitesToUser('test-employer', [1, 4]);

    // PE engages participant to site A
    cy.kcLogin('test-employer');
    progressParticipantHire(participantIdRegex, 1, 'available', 'prospecting');
    cy.kcLogout();

    // HA hires participant to site B
    cy.kcLogin('test-ha');
    progressParticipantHire(participantIdRegex, 4, 'prospecting', 'hired');

    // archive participant by HA
    archiveParticipant(participantIdRegex, 'Hired Candidates');
    acknowledgeArchive(participantIdRegex, 'My Candidates');
    cy.kcLogout();

    // move to archive by PE
    cy.kcLogin('test-employer');
    acknowledgeArchive(participantIdRegex, 'My Candidates');
  });
});
