/* eslint-disable no-restricted-syntax, no-await-in-loop */
const { dbClient, collections } = require('../db');

exports.shorthands = 'migrate-phase-data';

exports.up = async () => {
  const queries = [
    // Setup initial phase
    `INSERT INTO ${collections.GLOBAL_PHASE} (
            "name", start_date, end_date, created_by, updated_by, created_at, updated_at
        ) values(
            Initial Phase', '2020-01-01', '2022-12-31', 'system', NULL, now(), NULL)`,

    // Copy site's allocation to initial phase
    `INSERT INTO ${collections.SITE_PHASE_ALLOCATION} 
    (phase_id, site_id, allocation, start_date, end_date, created_by, updated_by, created_at, updated_at)
        SELECT
            1,
            id,
            CAST(COALESCE(body ->> 'allocation', '0') AS integer),
            NULL,
            NULL,
            'system',
            NULL,
            now(),
            NULL
        FROM
            employer_sites`,
    // Verification: Error will be raised if migration failed and transaction will fail
    `DO $$
    DECLARE
        numSites integer := 0;
        numSitePhaseAllocations integer := 0;
        errSites integer := COUNT(*)
            FROM
                employer_sites
                JOIN site_phase_allocation ON employer_sites.id = site_phase_allocation.site_id
            WHERE
                CAST(body ->> 'allocation' AS integer) <> allocation;          
               
    BEGIN 
        SELECT
            COUNT(es.id),
            COUNT(site_phase_allocation.id)
            INTO numSites, numSitePhaseAllocations
        FROM
            employer_sites es
        JOIN site_phase_allocation ON es.id = site_phase_allocation.site_id;
        RAISE NOTICE 'number of sites: %, SPA sites: %, errSites: %', numSites, numSitePhaseAllocations, errSites;
        

    IF errSites > 0 THEN
        RAISE EXCEPTION 'Migration failed: Sites with mismatched allocation';
    END IF;
    
    IF numSites <> numSitePhaseAllocations THEN
        RAISE EXCEPTION 'Migration failed: Mismatch between number of sites & number of site allocations';
    END IF;
    END $$`,
  ];
  await dbClient.db.withTransaction(async (tx) => {
    for (const query of queries) {
      await tx.query(query);
    }
  });

  await dbClient.reload();
};
