const { doCloseOverShiftTimes } = require('../../server/services/cron-jobs/shift-cron');

const start = async () => {
  const company = { dbName: 'rra_db' };

  await doCloseOverShiftTimes(company);
};

start().catch(console.error);
