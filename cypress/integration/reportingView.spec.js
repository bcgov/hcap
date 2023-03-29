describe('Reporting Download', () => {
  beforeEach(() => {
    cy.kcLogin('test-ha');
  });

  afterEach(() => {
    cy.kcLogout();
  });

  const navigateToReportingView = () => {
    cy.visit('/admin');
    cy.contains('button', 'Reporting').click();
  };

  describe('Health Authority', () => {
    beforeEach(() => {
      cy.kcLogin('test-ha');
      navigateToReportingView();
    });
    afterEach(() => {
      cy.kcLogout();
    });

    it('Should be able to download Hiring report by region', () => {});

    it('Should be able to download ROS milestone report by region', () => {});

    it('Should be able to PSI attending report', () => {});

    it('Should be not able to see additional reporting information on the reporting view as HA', () => {
      cy.kcLogin('test-ha');
      navigateToReportingView();
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

    it('Should be able to see additional reporting information on the reporting view as MOH', () => {});

    it('Should be able to download Hiring report as MOH', () => {});

    it('Should be able to ROS milestone report as MOH', () => {});

    it('Should be able to PSI attending report as MOH', () => {});
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
