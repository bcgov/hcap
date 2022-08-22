/* eslint-disable camelcase */
const { dbClient, views } = require('../db');

exports.shorthands = 'update-participant-status-infos';

exports.up = async () => {
  await dbClient.db.query(`CREATE OR REPLACE VIEW ${views.PARTICIPANTS_STATUS_INFOS} AS
    SELECT p.id,
     p.body,
     p.search,
     p.created_at,
     p.updated_at,
     jsonb_agg(ps.*) FILTER (WHERE ps.id IS NOT NULL) AS status_infos,
     jsonb_agg(DISTINCT jsonb_build_object('id', rosstatus.id, 'data', rosstatus.data, 'status', rosstatus.status, 'site_id', rosstatus.site_id, 'rosSite', ros_site.*)) FILTER (WHERE rosstatus.id IS NOT NULL) AS ros_infos
    FROM participants p
      LEFT JOIN return_of_service_status rosstatus ON p.id = rosstatus.participant_id AND rosstatus.is_current IS TRUE
      LEFT JOIN participants_status ps ON p.id = ps.participant_id AND ps.current IS TRUE
      LEFT JOIN employer_sites ros_site ON rosstatus.site_id = ros_site.id
   GROUP BY p.id, p.body, p.search, p.created_at, p.updated_at`);
};
