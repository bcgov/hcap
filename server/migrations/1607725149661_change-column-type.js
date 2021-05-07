exports.up = async (pgm) => {
  await pgm.alterColumn('participants_status', 'employer_id', {
    type: 'varchar(255)',
    notNull: true,
  });
};
