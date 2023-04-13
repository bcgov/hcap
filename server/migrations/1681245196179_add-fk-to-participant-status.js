exports.up = async (pgm) => {
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
             SET employer_id = ${user.id}
             WHERE employer_id = '${keycloakId}'`
          );
        }
        throw Error(`user with id '${keycloakId}' not found from 'users' table`);
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
             SET employer_id = '${user.body.keycloakId}'
             WHERE employer_id = '${id}'`
          );
        }
        throw Error(`user with id '${id}' not found from 'users' table`);
      })
  );
};
