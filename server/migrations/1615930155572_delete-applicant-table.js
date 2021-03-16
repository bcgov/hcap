exports.up = async (pgm) => {
  await pgm.dropTable('applicants', { ifExists: true });
};
