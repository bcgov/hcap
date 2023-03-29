describe('Reporting Download', () => {
  const navigateToReportingView = () => {
    cy.visit('/admin');
    cy.contains('Reporting').click();
  };

  const clickReportButton = (buttonLabel) => {
    cy.get('button').contains(buttonLabel).should('be.visible');
    cy.get('button').contains(buttonLabel).click();
  };

  describe('Health Authority', () => {
    beforeEach(() => {
      cy.kcLogin('test-ha');
      navigateToReportingView();
    });
    afterEach(() => {
      cy.kcLogout();
    });

    it('Should be able to download Hiring report by region', () => {
      clickReportButton('Download hiring report');
      cy.get('.MuiAlert-message').contains('Report generated successfully!').should('be.visible');
    });

    it('Should be able to download ROS milestone report by region', () => {
      clickReportButton('Download return of service milestones report');
      cy.get('.MuiAlert-message').contains('Report generated successfully!').should('be.visible');
    });

    it('Should be able to PSI attending report', () => {
      clickReportButton('Download participants attending PSI report');
      cy.get('.MuiAlert-message').contains('Report generated successfully!').should('be.visible');
    });

    it('Should be not able to see additional reporting information on the reporting view', () => {
      cy.contains('Milestone Reporting').should('not.exist');
      cy.contains('Hired Per Region').should('not.exist');
    });
  });

  describe('Ministry of Health', () => {
    beforeEach(() => {
      cy.kcLogin('test-moh');
      navigateToReportingView();
    });
    afterEach(() => {
      cy.kcLogout();
    });

    it('Should be able to see additional reporting information on the reporting view', () => {
      cy.get('.MuiTypography-subtitle1').contains('Milestone Reporting').should('be.visible');
      cy.get('.MuiTypography-subtitle1').contains('Hired Per Region').should('be.visible');
    });

    it('Should be able to download Hiring report', () => {
      clickReportButton('Download hiring report');
      cy.get('.MuiAlert-message').contains('Report generated successfully!').should('be.visible');
    });

    it('Should be able to ROS milestone report', () => {
      clickReportButton('Download return of service milestones report');
      cy.readFile(`return-of-service-milestones-${new Date().toJSON()}.csv`).should('exist');
      cy.get('.MuiAlert-message').contains('Report generated successfully!').should('be.visible');
    });

    it('Should be able to PSI attending report', () => {
      clickReportButton('Download participants attending PSI report');
      cy.get('.MuiAlert-message').contains('Report generated successfully!').should('be.visible');
    });
  });

  describe('Employer', () => {
    beforeEach(() => {
      cy.kcLogin('test-employer');
    });
    afterEach(() => {
      cy.kcLogout();
    });

    it('Should not allow employer to view the reporting button', () => {
      cy.visit('/admin');
      cy.contains('button', 'Reporting').should('not.exist');
    });

    it('Should not allow employer to view the reporting view page', () => {
      cy.visit('/reporting-view');
      cy.get('.MuiTypography-subtitle1')
        .contains(`You don't have permission to view this content.`)
        .should('be.visible');
    });
  });
});
