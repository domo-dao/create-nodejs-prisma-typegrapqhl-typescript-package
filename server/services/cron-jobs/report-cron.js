const reportService = require('../../services/report.service');

const doDailyReportToManagers = async (company) => {
  await reportService().sendDailyReportEmailToManagers(company);
};

module.exports = {
  doDailyReportToManagers,
};
