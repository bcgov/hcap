exports.up = async (pgm) => {
  await pgm.createView(
    'participants_status_infos',
    { temporary: false },
    `SELECT
  p.id, p.body, p.search, p.created_at, p.updated_at
, jsonb_agg(ps) FILTER (WHERE ps.id IS NOT NULL) AS status_infos
FROM
  participants AS p
LEFT OUTER JOIN participants_status AS ps
  ON p.id = ps.participant_id AND
ps.current IS true
GROUP BY p.id, p.body, p.search, p.created_at, p.updated_at`
  );
};
