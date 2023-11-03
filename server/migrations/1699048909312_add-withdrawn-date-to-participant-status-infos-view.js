/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = async (pgm) => {
  await pgm.sql(`
    CREATE OR REPLACE VIEW public.participants_status_infos AS
    SELECT p.id,
      p.body,
      p.search,
      p.created_at,
      p.updated_at,
      jsonb_agg(ps.*) FILTER (WHERE ps.id IS NOT NULL) AS status_infos,
      jsonb_agg(DISTINCT jsonb_build_object('id', rosstatus.id, 'data', rosstatus.data, 'status', rosstatus.status, 'site_id', rosstatus.site_id, 'rosSite', ros_site.*)) FILTER (WHERE rosstatus.id IS NOT NULL) AS ros_infos,
      case when p.body->>'interested' = 'withdrawn'
        then (
          select
          h.timestamp
          from jsonb_to_recordset(p.body->'history') as h(timestamp timestamp, changes jsonb )
          where h.changes[0]->>'to' = 'withdrawn'
          order by h.timestamp desc
          limit 1
        )
        else null
      end as withdrawn_at
    FROM participants p
    LEFT JOIN return_of_service_status rosstatus ON p.id = rosstatus.participant_id AND rosstatus.is_current IS TRUE
    LEFT JOIN participants_status ps ON p.id = ps.participant_id AND ps.current IS TRUE
    LEFT JOIN employer_sites ros_site ON rosstatus.site_id = ros_site.id
    GROUP BY p.id, p.body, p.search, p.created_at, p.updated_at;
  `);
};

exports.down = async (pgm) => {
  await pgm.sql(`
    DROP VIEW public.participants_status_infos;
    CREATE VIEW public.participants_status_infos
    AS SELECT p.id,
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
      GROUP BY p.id, p.body, p.search, p.created_at, p.updated_at;
  `);
};
