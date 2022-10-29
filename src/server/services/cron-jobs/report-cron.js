const reportService = require('../report.service');

const doDailyReportToManagers = async (company) => {
  await reportService().sendDailyReportEmailToManagers(company);
};

module.exports = {
  doDailyReportToManagers,
};
