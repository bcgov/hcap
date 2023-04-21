exports.up = async (pgm) => {
  await pgm.db.query(`
    ALTER TABLE participants_status
    ADD COLUMN old_employer_id VARCHAR(255)
  `);
  const { rows: users } = await pgm.db.query(`SELECT * FROM users`);
  const { rows: statuses } = await pgm.db.query(
    `SELECT DISTINCT employer_id FROM participants_status`
  );
  await Promise.all(
    statuses
      .map((status) => status.employer_id)
      .map((keycloakId) => {
        const user = users.find((u) => u.body.keycloakId === keycloakId);
        if (user) {
          return pgm.db.query(
            `UPDATE participants_status
             SET employer_id = ${user.id},
             old_employer_id = '${keycloakId}'
             WHERE employer_id = '${keycloakId}'`
          );
        }
        throw Error(`user with id '${keycloakId}' not found from 'users' table`);
      })
  );

  const { rows: hiddenStatuses } = await pgm.db.query(
    `SELECT * FROM participants_status WHERE data->>'hiddenForUserIds' IS NOT NULL`
  );
  await Promise.all(
    hiddenStatuses.map((status) => {
      const { hiddenForUserIds } = status.data;
      const keycloakIds = Object.keys(hiddenForUserIds);
      const usersFromKeycloakIds = keycloakIds.map((keycloakId) =>
        users.find((u) => u.body.keycloakId === keycloakId)
      );
      if (usersFromKeycloakIds.length === keycloakIds.length) {
        const userIds = usersFromKeycloakIds.map((u) => `"${u.id}": true`);
        return pgm.db.query(
          `UPDATE participants_status
             SET data = jsonb_set(data, '{hiddenForUserIds}', '{${userIds.join(',')}}')
             WHERE id = ${status.id}`
        );
      }
      throw Error(`unable to edit hiddenForUserIds for status ${status.id}`);
    })
  );

  await pgm.db.query(`
    ALTER TABLE participants_status
    ALTER COLUMN employer_id TYPE INT
    USING employer_id::integer`);

  await pgm.db.query(`
    ALTER TABLE participants_status
    ADD CONSTRAINT fk_participants_status_users
    FOREIGN KEY (employer_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE`);

  await pgm.db.query(`
    ALTER TABLE participants_status
    ADD CONSTRAINT fk_participants_status_participants
    FOREIGN KEY (participant_id) REFERENCES participants(id)
    ON DELETE CASCADE ON UPDATE CASCADE`);
};

exports.down = async (pgm) => {
  await pgm.db.query(`
    ALTER TABLE participants_status
    DROP CONSTRAINT fk_participants_status_users`);

  await pgm.db.query(`
    ALTER TABLE participants_status
    DROP CONSTRAINT fk_participants_status_participants`);

  await pgm.db.query(`
    ALTER TABLE participants_status
    ALTER COLUMN employer_id TYPE VARCHAR(255)`);

  const { rows: users } = await pgm.db.query(`SELECT * FROM users`);

  const { rows: hiddenStatuses } = await pgm.db.query(
    `SELECT * FROM participants_status WHERE data->>'hiddenForUserIds' IS NOT NULL`
  );
  await Promise.all(
    hiddenStatuses.map((status) => {
      const { hiddenForUserIds } = status.data;
      const hiddenIds = Object.keys(hiddenForUserIds);
      const usersFromHiddenIds = hiddenIds.map((id) => users.find((u) => u.id === +id));
      if (usersFromHiddenIds.length === hiddenIds.length) {
        const userIds = usersFromHiddenIds.map((u) => `"${u.body.keycloakId}": true`);
        return pgm.db.query(
          `UPDATE participants_status
             SET data = jsonb_set(data, '{hiddenForUserIds}', '{${userIds.join(',')}}')
             WHERE id = ${status.id}`
        );
      }
      throw Error(`unable to edit hiddenForUserIds for status ${status.id}`);
    })
  );

  const { rows: statuses } = await pgm.db.query(
    `SELECT DISTINCT employer_id FROM participants_status`
  );
  await Promise.all(
    statuses
      .map((status) => status.employer_id)
      .map((id) => {
        const user = users.find((u) => u.id === +id);
        if (user) {
          return pgm.db.query(
            `UPDATE participants_status
             SET employer_id = '${user.body.keycloakId}',
             old_employer_id = NULL
             WHERE employer_id = '${id}'`
          );
        }
        throw Error(`user with id '${id}' not found from 'users' table`);
      })
  );
  await pgm.db.query(`
    ALTER TABLE participants_status
    DROP COLUMN old_employer_id
  `);
};
