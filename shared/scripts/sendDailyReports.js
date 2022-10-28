const { doDailyReportToManagers } = require('../../server/services/cron-jobs/report-cron');

const start = async () => {
  const company = {
    dbName: 'rra_db',
  };

  await doDailyReportToManagers(company);
};

start().catch(console.error);
