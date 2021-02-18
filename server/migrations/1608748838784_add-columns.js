exports.up = async (pgm) => {
  await pgm.addColumns('participants_status', { data: 'jsonb' }, { ifNotExists: true });
};
