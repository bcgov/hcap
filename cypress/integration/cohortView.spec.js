describe('Tests the Cohort View', () => {
  before(() => {
    getCohortParticipantsFromCSV();
    getCohorts();
    getPSI();
  });

  beforeEach(() => {
    cy.kcLogout();
  });

  const handleCSVtoArr = (csvData) => {
    const rows = csvData.split('\n');
    const headers = rows[0].split(',');
    const rowArr = [];

    rows.slice(1).forEach((row) => {
      const values = row.split(',');
      const obj = {};

      headers.forEach((header, index) => {
        obj[header] = values[index];
      });

      rowArr.push(obj);
    });
    return rowArr;
  };

  const getCohortParticipantsFromCSV = () => {
    cy.readFile('server/test-data/cohort_participants.csv').then((csvData) => {
      const result = handleCSVtoArr(csvData);

      // Store the data in the Cypress test context
      cy.wrap(result).as('cohortParticipants');
    });
  };

  const getCohorts = () => {
    cy.readFile('server/test-data/cohorts.csv').then((csvData) => {
      const result = handleCSVtoArr(csvData);

      // Store the data in the Cypress test context
      cy.wrap(result).as('cohorts');
    });
  };

  const getPSI = () => {
    cy.readFile('server/test-data/post_secondary_institutions.csv').then((csvData) => {
      const rows = csvData.split('\n');
      const headers = rows[0].split(',');
      const rowArr = [];

      rows.slice(1).forEach((row) => {
        const values = row.split(',');
        const obj = {};

        headers.forEach((header, index) => {
          obj[header] = values[index];
        });

        rowArr.push(obj);
      });
      //  const result = handleCSVtoArr(csvData)

      //   // Store the data in the Cypress test context
      cy.wrap(rowArr).as('psi');
    });
  };

  const visitsCohort = () => {
    cy.visit('/admin');
    cy.contains('Manage PSI').click();
    cy.get('div[aria-label="Health Authority filter"]').click();
    cy.get('li').contains('Fraser').click();

    // Click on a PSI in fraser, and click on a cohort
    cy.get('@psi').then((psi) => {
      const pisInFraser = psi.filter((institute) => institute.health_authority === 'Fraser');
      cy.contains(pisInFraser[0]).click();
      cy.get('@cohorts').then((cohorts) => {
        cohortInPSI = cohorts.filter((cohort) => cohort.psi_id === pisInFraser[0].id);
        cy.contains(cohortInPSI[0].cohort_name).click();
      });
    });
  };

  // const visitsCohort = (cohortName) => {
  //   cy.visit('/admin');
  //   cy.contains('Manage PSI').click();
  //   cy.get('div[aria-label="Health Authority filter"]').click();
  //   cy.get('li').contains('Fraser').click();

  //   cy.get('@psi').then((psi) => {
  //   cy.contains('Full Sawfly University').click();
  //   cy.contains(cohortName).click();
  //   }
  // };

  it('HA visits a PSI details page -> creates new cohort -> checks for no participants in the table', () => {
    cy.kcLogin('test-ha');
    cy.visit('/admin');
    cy.contains('Manage PSI').click();

    // Select a PSI in the region of HA - Fraser
    cy.get('div[aria-label="Health Authority filter"]').click();
    cy.get('li').contains('Fraser').click();

    cy.contains('Full Sawfly University').click();
    cy.get('button').contains('Manage').click();
    cy.get('li').contains('Add Cohort').should('be.visible').click();

    // Submits successful form
    cy.get('input#cohortName').type('Empty New Cohort');
    cy.get('input[name="StartDate"]').clear().type('2023/01/01');
    cy.get('input[name="EndDate"]').clear().type('2024/01/01');
    cy.get('input#cohortSize').type('100');
    cy.get('button').contains('Submit').click();
    // expect success message
    // cy.wait(1000);
    cy.get('div.MuiAlert-message')
      .contains(`Cohort 'Empty New Cohort' added successfully`)
      .should('be.visible');

    // navigate to /cohort/:id
    cy.contains('Empty New Cohort').click();
    cy.get('.MuiTypography-subtitle1')
      .contains('No Participants in this Cohort')
      .should('be.visible');
    cy.get('.MuiTypography-body1').contains('100');
  });

  it('MOH visits cohort view, cannot `Bulk Graduate`', () => {
    cy.kcLogin('test-moh');
    visitsCohort();

    cy.get('.MuiTypography-subtitle1')
      .contains('No Participants in this Cohort')
      .should('be.visible');
    // MOH can see all PARTICIPANTS
    // cy.get('.MuiAlert-standardInfo')
    //   .contains('Participants hired outside your region will not appear in this list')
    //   .should('not.exist');

    cy.get('button').contains('Bulk Graduate').should('not.exist');
  });

  it('MOH visits cohort view, can see all participants in every region', () => {
    cy.kcLogin('test-moh');
    visitsCohort();

    // MOH can see all PARTICIPANTS
    cy.get('.MuiAlert-standardInfo').should('not.exist');
  });

  it('HA visits cohort view, can `Bulk Graduate`', () => {
    cy.kcLogin('test-ha');
    visitsCohort();

    cy.get('.MuiTypography-subtitle1')
      .contains('No Participants in this Cohort')
      .should('be.visible');

    cy.get('.MuiAlert-standardInfo')
      .contains('Participants hired outside your region will not appear in this list')
      .should('be.visible');

    cy.get('button').contains('Bulk Graduate').should('be.visible');
  });

  it('HA visits cohort view, can only see participants in their region', () => {
    cy.kcLogin('test-ha');
    visitsCohort();

    cy.get('.MuiTypography-subtitle1')
      .contains('No Participants in this Cohort')
      .should('be.visible');

    cy.get('.MuiAlert-standardInfo')
      .contains('Participants hired outside your region will not appear in this list')
      .should('be.visible');
  });
});
